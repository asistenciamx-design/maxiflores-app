import { createClient } from '@/lib/supabase/server';
import { Package, ShoppingCart, BarChart3, CheckSquare, ChevronDown, Check, ChevronUp } from 'lucide-react';
import SurtidoClient from './client'; // Client component for interactivity
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// In Next.js 15+, searchParams is a Promise
export default async function SurtidoPage(props: { searchParams: Promise<{ date?: string; startTime?: string; endTime?: string }> }) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/');
    }

    // Search Params: Date & Time
    const date = searchParams?.date || new Date().toISOString().split('T')[0];
    const startTime = searchParams?.startTime || '00:00';
    const endTime = searchParams?.endTime || '23:59';
    
    console.log(`[SurtidoPage] Request for Date: ${date}, Time: ${startTime} - ${endTime}`);

    // Fetch Varieties with their related Order Items and Orders
    // NOTE: Supabase PostgREST does NOT support filtering on nested relations (2+ levels deep)
    // Filters like .gte('order_items.orders.delivery_date', ...) are IGNORED
    // Therefore, we fetch ALL data and filter in-memory (see lines 72-81)
    
    console.log(`[SurtidoPage] Fetching all varieties and order_items (will filter in-memory for date: ${date})`);
    
    const { data: varieties, error } = await supabase
        .from('varieties')
        .select(`
      id,
      name,
      sku,
      image_url,
      order_items (
        id,
        quantity,
        orders (
          id,
          order_number,
          client_name,
          location,
          is_vip,
          created_at,
          delivery_date
        )
      )
    `);

    // !inner on orders ensures we only get varieties that have orders on this date.
    // However, Supabase postgrest-js .eq('order_items.orders.delivery_date', ...) works if relationship is embedded.
    // Actually, 'orders!inner' implies strict join. 
    // And we filter orders by delivery_date.
    
    console.log(`[SurtidoPage] Fetched ${varieties?.length || 0} varieties from database`);
    
    // In-Memory Time Filter & Transform
    let totalPackages = 0;
    let activeOrdersCount = 0;
    const activeOrderIds = new Set();

    // NEW APPROACH: Group by Order First, then collect varieties
    // This prevents the same order from appearing multiple times across different varieties
    const ordersMap = new Map();
    
    varieties?.forEach(v => {
        // Filter order_items by delivery_date AND creation time
        const validOrderItems = v.order_items.filter((oi: any) => {
            // CRITICAL: Check if orders relation exists
            if (!oi.orders) {
                console.warn(`[SurtidoPage] order_item ${oi.id} has null orders relation`);
                return false;
            }
            
            // First filter by delivery date
            const itemDate = oi.orders.delivery_date ? oi.orders.delivery_date.split('T')[0] : '';
            if (itemDate !== date) return false;

            // Then filter by creation time
            const orderDate = new Date(oi.orders.created_at);
            const localTime = orderDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City' });
            
            if (startTime && localTime < startTime) return false;
            if (endTime && localTime > endTime) return false;
            return true;
        });

        // Add each valid order item to the global orders map
        validOrderItems.forEach((oi: any) => {
            const orderId = oi.orders.id;
            
            if (!ordersMap.has(orderId)) {
                ordersMap.set(orderId, {
                    orderData: oi.orders,
                    varieties: []
                });
            }
            
            // Add this variety to the order's variety list
            ordersMap.get(orderId).varieties.push({
                varietyId: v.id,
                varietyName: v.name,
                varietySku: v.sku,
                varietyImage: v.image_url,
                quantity: oi.quantity,
                itemId: oi.id
            });
        });
    });

    // Convert orders map to items array for display
    const items = Array.from(ordersMap.values()).map(({ orderData, varieties: orderVarieties }) => {
        // Group varieties by variety ID to handle duplicates within the same order
        const varietiesMap = new Map();
        orderVarieties.forEach((v: any) => {
            if (!varietiesMap.has(v.varietyId)) {
                varietiesMap.set(v.varietyId, {
                    ...v,
                    totalQuantity: 0
                });
            }
            // Sum quantities for the same variety (in case of duplicates)
            varietiesMap.get(v.varietyId).totalQuantity += v.quantity;
        });

        const uniqueVarieties = Array.from(varietiesMap.values());
        const orderTotalPackages = uniqueVarieties.reduce((sum, v) => sum + v.totalQuantity, 0);
        
        totalPackages += orderTotalPackages;
        activeOrderIds.add(orderData.id);

        // For display, we'll show the primary variety (first one or most common)
        const primaryVariety = uniqueVarieties[0];

        return {
            id: `${orderData.id}-${primaryVariety.varietyId}`, // Composite key: orderId + varietyId
            varietyId: primaryVariety.varietyId, // Keep original for selection logic
            name: primaryVariety.varietyName,
            sku: primaryVariety.varietySku,
            image: primaryVariety.varietyImage,
            totalPackages: orderTotalPackages,
            orders: [{
                id: orderData.order_number || `#${orderData.id.split('-')[0].toUpperCase()}`,
                client: orderData.client_name,
                location: orderData.location,
                qty: `${orderTotalPackages} Paqs`,
                totalOrders: 1,
                vip: orderData.is_vip
            }]
        };
    });
    
    activeOrdersCount = activeOrderIds.size;


    return (
        <div className="max-w-[1200px] mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#151217] dark:text-white tracking-tight mb-2">Lista de Surtido</h1>
                    <p className="text-[#776685] dark:text-gray-400 text-base">Gestión de picking en tiempo real.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-[#776685] dark:text-gray-300 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg border border-[#e1dce4] dark:border-white/10">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Conectado a Bases de Datos
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-[#e1dce4] dark:border-white/10 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[#776685] dark:text-gray-400">
                        <Package className="size-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Paquetes Totales</span>
                    </div>
                    <span className="text-5xl font-black text-accent-purple">{totalPackages}</span>
                    <p className="text-xs text-[#776685] dark:text-gray-500">Solicitados hoy</p>
                </div>

                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-[#e1dce4] dark:border-white/10 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[#776685] dark:text-gray-400">
                        <ShoppingCart className="size-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Total Pedidos</span>
                    </div>
                    <span className="text-5xl font-black text-[#151217] dark:text-white">{activeOrdersCount}</span>
                    <p className="text-xs text-[#776685] dark:text-gray-500">Órdenes activas</p>
                </div>

                {/* Custom Donut Chart Card */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-[#e1dce4] dark:border-white/10 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-[#776685] dark:text-gray-400">
                                <BarChart3 className="size-5" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Progreso</span>
                            </div>
                            <span className="text-5xl font-black text-[#151217] dark:text-white">35%</span>
                        </div>
                        <div className="relative w-20 h-20">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path className="text-[#f2f1f4] dark:text-white/10 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                                <path className="text-accent-purple stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="35, 100" strokeLinecap="round" strokeWidth="3"></path>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CheckSquare className="text-accent-purple size-6" />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-[#776685] dark:text-gray-500">Simulación en tiempo real</p>
                </div>
            </div>

            <SurtidoClient 
                initialItems={items} 
                initialDate={date}
                initialStartTime={startTime}
                initialEndTime={endTime}
            />
        </div>
    );
}
