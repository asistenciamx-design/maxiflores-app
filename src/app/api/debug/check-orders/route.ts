import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orderNumbers = searchParams.get('numbers')?.split(',') || ['5447', '5608', '5618'];
    
    try {
        const supabase = await createClient();
        
        const results: any = {};
        
        for (const num of orderNumbers) {
            const orderNum = num.trim().startsWith('#') ? num.trim() : `#${num.trim()}`;
            
            // Check orders table
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('order_number', orderNum)
                .single();
            
            // Check order_items table
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                    *,
                    orders (
                        order_number,
                        client_name,
                        delivery_date,
                        created_at
                    ),
                    varieties (
                        name
                    )
                `)
                .eq('orders.order_number', orderNum);
            
            results[orderNum] = {
                in_orders_table: !!orderData,
                order_data: orderData || null,
                order_error: orderError?.message || null,
                in_order_items_table: (itemsData?.length || 0) > 0,
                items_count: itemsData?.length || 0,
                items_data: itemsData || [],
                items_error: itemsError?.message || null
            };
        }
        
        return NextResponse.json({
            checked_orders: orderNumbers,
            results
        });

    } catch (error: any) {
        console.error('[CheckOrders] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            message: error.message 
        }, { status: 500 });
    }
}
