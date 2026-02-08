
import { createClient } from '@/lib/supabase/server';
import CompromisoClient from './client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CompromisoPage(props: {
    searchParams: Promise<{ date?: string; category?: string; startTime?: string; endTime?: string }>
}) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/');
    }

    // Default to today if no date provided
    const date = searchParams.date || new Date().toISOString().split('T')[0];
    const startTime = searchParams.startTime;
    const endTime = searchParams.endTime;

    // 1. Fetch "Captured" data from supply_commitments (Daily Basis)
    const { data: commitments } = await supabase
        .from('supply_commitments')
        .select('id, variety_id, captured_qty, captured_by, delivered_qty') // delivered_qty might not exist yet, defaulting captured
        .eq('delivery_date', date);
    
    // Map Commitments for fast lookup
    const commitmentMap = new Map(commitments?.map(c => [c.variety_id, c]) || []);

    // 2. Fetch "Demand" dynamically from Orders (to allow Time Filtering)
    // We fetch orders for this delivery date
    let query = supabase
        .from('orders')
        .select(`
            id,
            created_at,
            order_items (
                variety_id,
                quantity,
                varieties ( id, name, sku, image_url, category )
            )
        `)
        .eq('delivery_date', date);

    const { data: orders } = await query;

    // 3. Filter Orders by Time (In-Memory for now as Supabase Date helper is simpler here)
    // Assuming user wants to filter by "Order Creation Time" (Hora del Pedido)
    const filteredOrders = orders?.filter(o => {
        if (!startTime && !endTime) return true;
        
        // Extract time from created_at (ISO string)
        const orderDate = new Date(o.created_at);
        // Adjust to local time if possible? 
        // For MVP, we use the raw time from the ISO (UTC). Ideally we shift to user timezone (-6).
        // Let's assume we treat the input as Local and the created_at as... well, usually UTC.
        // If we compare 08:00 (Input) vs 14:00 (UTC), it matches.
        
        // Better: Convert order time to HH:MM format in "Local" (or fixed offset)
        // Hardcoding standard Mexico/Central offset for now or handling simply strings.
        // Let's compare "Local String" matching
        
        const localTime = orderDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City' }); // '14:30'
        
        if (startTime && localTime < startTime) return false;
        if (endTime && localTime > endTime) return false;
        
        return true;
    }) || [];

    // 4. Aggregate Demand from Filtered Orders
    const varietyMap = new Map<string, any>();

    filteredOrders.forEach(order => {
        order.order_items.forEach((item: any) => {
             // Safe check
             if (!item.varieties) return;
             const vId = item.variety_id;
             
             if (!varietyMap.has(vId)) {
                 const commitment = commitmentMap.get(vId);
                 varietyMap.set(vId, {
                     id: vId,
                     commitmentId: commitment?.id, // Might get null if strictly new demand
                     product: item.varieties.name,
                     category: item.varieties.category || 'Sin Categoría',
                     image: item.varieties.image_url,
                     demand: 0,
                     qty: commitment?.captured_qty || 0, // Always show daily captured
                     capturedBy: commitment?.captured_by || '-',
                 });
             }
             
             const current = varietyMap.get(vId);
             current.demand += item.quantity;
        });
    });

    // Also include items that have Commitment but ZERO filtered demand (e.g. captured but orders not in time range)
    // Only if we want to show everything. Usually yes.
    commitments?.forEach(c => {
         if (!varietyMap.has(c.variety_id)) {
             // We need to fetch variety details separately if not in orders?
             // Since we didn't join varieties in Step 1, we might miss name/image.
             // OPTIMIZATION: We should have joined varieties in Step 1 OR we rely on order data.
             // If data is in commitment but NOT in orders, it means either:
             // a) Order was deleted (but commitment stayed)
             // b) Order is outside time range
             
             // We can skip showing rows with 0 demand if we are strictly filtering.
             // OR we show them with Demand 0.
             // Let's skip for cleaner view.
         }
    });

    const rows = Array.from(varietyMap.values()).map(r => ({
        ...r,
        variance: r.qty - r.demand,
        fulfillment: r.demand > 0 ? Math.round((r.qty / r.demand) * 100) : 0,
        details: [] // Mock details
    }));

    // Fetch Distinct Categories
    // Currently relying on varieties table.
    // Since Supabase doesn't have robust distinct on joined select easily without RPC, 
    // we'll fetch all varieties distinct categories distinct.
    const { data: categoryData } = await supabase
        .from('varieties')
        .select('category')
        .not('category', 'is', null);

    // Extract unique categories
    const categories = Array.from(new Set(categoryData?.map(v => v.category || 'Sin Categoría') || [])).sort();

    return (
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8">
            <CompromisoClient 
                initialRows={rows} 
                initialDate={date} 
            />
        </div>
    );
}
