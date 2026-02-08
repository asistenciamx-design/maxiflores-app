import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('number') || '5608';

    // Use environment variables for credentials
    const SHOP_URL = process.env.SHOPIFY_SHOP_URL || '1dmass-ij.myshopify.com';
    const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
        return NextResponse.json({ error: 'Missing SHOPIFY_ACCESS_TOKEN' }, { status: 500 });
    }

    try {
        // Fetch order by name (Shopify uses 'name' parameter for order number)
        const url = `https://${SHOP_URL}/admin/api/2024-01/orders.json?name=%23${orderNumber}&status=any&limit=1`;
        
        console.log(`[DebugOrder] Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ 
                error: `Shopify API error: ${response.status}`,
                details: errorText,
                url: url
            }, { status: response.status });
        }

        const data = await response.json();
        
        if (!data.orders || data.orders.length === 0) {
            return NextResponse.json({
                error: 'Order not found',
                searched_for: `#${orderNumber}`,
                url: url
            }, { status: 404 });
        }

        const order = data.orders[0];

        // Extract delivery date using current logic
        let extractedDeliveryDate = null;
        const noteAttrs = order.note_attributes || [];
        const deliveryAttr = noteAttrs.find((a: any) => a.name === 'Fecha de Recolección');
        if (deliveryAttr && deliveryAttr.value) {
            const parts = deliveryAttr.value.split('/');
            if (parts.length === 3) {
                extractedDeliveryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        return NextResponse.json({
            order_number: order.name,
            shopify_id: order.id,
            created_at: order.created_at,
            updated_at: order.updated_at,
            status: order.financial_status,
            fulfillment_status: order.fulfillment_status,
            
            // Raw note_attributes for debugging
            note_attributes_raw: noteAttrs,
            note_attributes_count: noteAttrs.length,
            
            // Extraction results
            found_delivery_attr: !!deliveryAttr,
            delivery_attr_value: deliveryAttr?.value || null,
            extracted_delivery_date: extractedDeliveryDate,
            fallback_date: order.created_at,
            
            // What would be saved to DB
            final_delivery_date: extractedDeliveryDate || order.created_at,
            
            // Customer info
            customer: {
                name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
                email: order.customer?.email
            },
            
            // Line items
            line_items_count: order.line_items?.length || 0,
            line_items: order.line_items?.map((item: any) => ({
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                current_quantity: item.current_quantity
            }))
        });

    } catch (error: any) {
        console.error('[DebugOrder] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            message: error.message 
        }, { status: 500 });
    }
}
