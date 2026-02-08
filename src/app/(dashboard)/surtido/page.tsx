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
    
    // Helper functions to extract base product name and variant
    function extractBaseProductName(fullName: string): string {
        // Remove variant suffix like " - Estándar", " - Primera", " - Premium"
        const variantPattern = / - (Estándar|Primera|Premium|Default Title)$/i;
        return fullName.replace(variantPattern, '').trim();
    }

    function extractVariantName(fullName: string): string {
        const match = fullName.match(/ - (Estándar|Primera|Premium)$/i);
        if (!match) return 'Sin Variante';
        
        // Normalize to proper capitalization
        const variant = match[1].toLowerCase();
        if (variant === 'estándar') return 'Estándar';
        if (variant === 'primera') return 'Primera';
        if (variant === 'premium') return 'Premium';
        
        return match[1]; // Fallback to original capitalization
    }
    
    // In-Memory Time Filter & Transform
    let totalPackages = 0;
    let activeOrdersCount = 0;
    const activeOrderIds = new Set();
    const uniqueClients = new Set(); // Track unique client names

    // NEW APPROACH: Group by BASE PRODUCT NAME (without variant suffix)
    // This groups all variants (Estándar, Primera, Premium) of the same product together
    const baseProductsMap = new Map();
    
    varieties?.forEach(v => {
        const baseName = extractBaseProductName(v.name);
        const variantName = extractVariantName(v.name);
        
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

        // Skip varieties with no valid orders for this date/time
        if (validOrderItems.length === 0) return;

        // Calculate total packages for THIS variety (specific variant)
        const totalPackagesForVariety = validOrderItems.reduce((sum, oi: any) => sum + oi.quantity, 0);
        
        // Initialize base product if not exists
        if (!baseProductsMap.has(baseName)) {
            baseProductsMap.set(baseName, {
                id: baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
                varietyId: v.id,
                name: baseName,
                sku: v.sku,
                image: v.image_url,
                totalPackages: 0,
                variantSummary: {},
                orders: []
            });
        }
        
        const product = baseProductsMap.get(baseName);
        
        // Track variant totals
        if (!product.variantSummary[variantName]) {
            product.variantSummary[variantName] = 0;
        }
        product.variantSummary[variantName] += totalPackagesForVariety;
        product.totalPackages += totalPackagesForVariety;
        
        // Collect ALL orders for this variant with variant info
        validOrderItems.forEach((oi: any) => {
            activeOrderIds.add(oi.orders.id);
            uniqueClients.add(oi.orders.client_name);
            
            product.orders.push({
                id: oi.orders.order_number || `#${oi.orders.id.split('-')[0].toUpperCase()}`,
                client: oi.orders.client_name,
                location: oi.orders.location,
                qty: `${oi.quantity} Paqs`,
                variant: variantName, // ← NEW: track which variant this order requested
                totalOrders: 1,
                vip: oi.orders.is_vip
            });
        });

        totalPackages += totalPackagesForVariety;
    });

    // Convert base products map to items array for display
    const items = Array.from(baseProductsMap.values());
    
    activeOrdersCount = activeOrderIds.size;
    const uniqueClientsCount = uniqueClients.size;


    return (
        <div className="max-w-[1200px] mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#151217] dark:text-white tracking-tight mb-2">Lista de Pedidos</h1>
                    <p className="text-[#776685] dark:text-gray-400 text-base">Vista de productos solicitados por pedido y cliente en tiempo real.</p>
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

                {/* Total Clientes Card */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-[#e1dce4] dark:border-white/10 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[#776685] dark:text-gray-400">
                        <BarChart3 className="size-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Total de Clientes</span>
                    </div>
                    <span className="text-5xl font-black text-[#151217] dark:text-white">{uniqueClientsCount}</span>
                    <p className="text-xs text-[#776685] dark:text-gray-500">Clientes únicos</p>
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
