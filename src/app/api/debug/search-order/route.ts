import { NextRequest, NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('number');

    if (!orderNumber) {
        return NextResponse.json({ error: 'Order number required' }, { status: 400 });
    }

    try {
        // Search by order number using the name parameter
        const endpoint = `orders.json?name=${orderNumber}&status=any&limit=10`;
        
        console.log(`[SearchOrder] Searching for order: ${orderNumber}`);

        const response = await shopifyFetch<any>(endpoint);

        if (!response.ok) {
            console.error(`[SearchOrder] Shopify API error: ${response.status} - ${response.details}`);
            return NextResponse.json({ 
                error: 'Shopify API error', 
                status: response.status,
                details: response.details 
            }, { status: response.status });
        }

        const data = response.data;
        
        return NextResponse.json({
            query: orderNumber,
            found: data.orders?.length || 0,
            orders: data.orders?.map((order: any) => ({
                id: order.id,
                name: order.name,
                order_number: order.order_number,
                created_at: order.created_at,
                fulfillment_status: order.fulfillment_status,
                financial_status: order.financial_status,
                note_attributes: order.note_attributes,
                line_items_count: order.line_items?.length || 0,
                line_items: order.line_items?.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    quantity: item.quantity,
                }))
            }))
        });

    } catch (error: any) {
        console.error('[SearchOrder] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            message: error.message 
        }, { status: 500 });
    }
}
