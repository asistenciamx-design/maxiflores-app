import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get all orders with their details
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Check specifically for orders 5608 and 5618
        const order5608 = orders?.find(o => o.order_number === '#5608' || o.order_number === '5608');
        const order5618 = orders?.find(o => o.order_number === '#5618' || o.order_number === '5618');

        // Get orders with delivery_date in February 2026
        const febOrders = orders?.filter(o => {
            const deliveryDate = o.delivery_date;
            if (!deliveryDate) return false;
            return deliveryDate.startsWith('2026-02');
        });

        // Get sample of orders to see the pattern
        const sampleOrders = orders?.slice(0, 10).map(o => ({
            order_number: o.order_number,
            shopify_id: o.shopify_id,
            client_name: o.client_name,
            created_at: o.created_at,
            delivery_date: o.delivery_date,
            status: o.status
        }));

        return NextResponse.json({
            total_orders_in_db: orders?.length || 0,
            order_5608_found: !!order5608,
            order_5608_data: order5608 || null,
            order_5618_found: !!order5618,
            order_5618_data: order5618 || null,
            february_orders_count: febOrders?.length || 0,
            february_orders_sample: febOrders?.slice(0, 5).map(o => ({
                order_number: o.order_number,
                delivery_date: o.delivery_date,
                created_at: o.created_at
            })),
            recent_orders_sample: sampleOrders
        });

    } catch (error: any) {
        console.error('[DBInspect] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            message: error.message 
        }, { status: 500 });
    }
}
