
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '2026-02-09'; // Default to user's problematic date

    // Orders to check
    const visibleNumbers = [5563, 5610, 5738, 6075, 6361];
    const missingNumbers = [5447, 5448, 5494, 5608, 5618];
    const allNumbers = [...visibleNumbers, ...missingNumbers];

    // 1. Fetch Orders details
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('order_number', allNumbers);

    if (ordersError) {
        return NextResponse.json({ error: ordersError }, { status: 500 });
    }

    // 2. Fetch Order Items for these orders
    const orderIds = orders?.map(o => o.id) || [];
    const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*, varieties(name, sku)')
        .in('order_id', orderIds);

    // 3. Check "Varieties" fetch limit
    // The main page fetches 'varieties' then nested 'order_items'.
    // If there are many varieties, or many order_items per variety, pagination might kill it.
    
    // Let's count total varieties and order_items to see if we hit limits
    const { count: varietiesCount } = await supabase.from('varieties').select('*', { count: 'exact', head: true });
    const { count: orderItemsCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });


    return NextResponse.json({
        date_filter: date,
        orders_found: orders?.map(o => ({
            id: o.id,
            number: o.order_number,
            delivery_date: o.delivery_date,
            created_at: o.created_at,
            status: o.status, // maybe status filter?
            financial_status: o.financial_status,
            fulfillment_status: o.fulfillment_status
        })),
        orders_missing_from_db: allNumbers.filter(n => !orders?.find(o => o.order_number === n)),
        items_count_by_order: orderIds.reduce((acc, id) => {
            acc[id] = orderItems?.filter(i => i.order_id === id).length;
            return acc;
        }, {} as Record<string, number>),
        global_counts: {
            varieties: varietiesCount,
            order_items: orderItemsCount
        }
    });
}
