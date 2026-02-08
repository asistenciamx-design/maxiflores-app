import { NextRequest, NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('number') || '5608';

    // Use environment variables for credentials
    const SHOP_URL = process.env.SHOPIFY_SHOP_URL || '1dmass-ij.myshopify.com';

    try {
        // Search for order by name with # prefix
        const endpoint = `orders.json?name=%23${orderNumber}&status=any&limit=1`;
        const url = `https://${SHOP_URL}/admin/api/2024-01/${endpoint}`;
        
        console.log(`[RawOrder] Fetching order #${orderNumber} from Shopify`);
        console.log(`[RawOrder] URL: ${url}`);

        const response = await shopifyFetch<any>(endpoint);

        if (!response.ok) {
            console.error(`[RawOrder] Shopify API error: ${response.status}`);
            return NextResponse.json({ 
                error: `Shopify API returned ${response.status}`,
                details: response.details,
                note: 'This might mean the access token needs to be refreshed in the sync endpoint'
            }, { status: response.status });
        }

        const data = response.data;
        
        if (!data.orders || data.orders.length === 0) {
            console.log(`[RawOrder] Order #${orderNumber} not found`);
            return NextResponse.json({
                error: 'Order not found',
                searched_for: `#${orderNumber}`,
                note: 'The order might not exist or might have a different number format'
            }, { status: 404 });
        }

        const order = data.orders[0];
        
        console.log(`[RawOrder] Found order #${orderNumber}`);
        console.log(`[RawOrder] note_attributes:`, JSON.stringify(order.note_attributes, null, 2));

        // Return the complete raw order data
        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                name: order.name,
                created_at: order.created_at,
                updated_at: order.updated_at,
                financial_status: order.financial_status,
                fulfillment_status: order.fulfillment_status,
                note_attributes: order.note_attributes,
                customer: order.customer,
                shipping_address: order.shipping_address,
                line_items: order.line_items?.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    quantity: item.quantity,
                    current_quantity: item.current_quantity,
                    product_id: item.product_id
                }))
            }
        });

    } catch (error: any) {
        console.error('[RawOrder] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            message: error.message 
        }, { status: 500 });
    }
}
