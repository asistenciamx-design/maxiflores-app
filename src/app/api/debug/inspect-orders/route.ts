import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orderNumbers = searchParams.get('numbers')?.split(',') || [];

    if (orderNumbers.length === 0) {
        return NextResponse.json({ error: 'Provide order numbers as ?numbers=5608,5618' }, { status: 400 });
    }

    // Use environment variables for credentials
    const shopifyDomain = process.env.SHOPIFY_SHOP_URL || '1dmass-ij.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    try {
        const results: any[] = [];

        for (const orderNum of orderNumbers) {
            const url = `https://${shopifyDomain}/admin/api/2024-01/orders.json?name=${orderNum.trim()}&status=any&limit=5`;
            
            console.log(`[InspectOrders] Fetching order: ${orderNum}`);

            const response = await fetch(url, {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                results.push({
                    order_number: orderNum,
                    error: `Shopify API error: ${response.status}`,
                    found: false
                });
                continue;
            }

            const data = await response.json();
            
            if (!data.orders || data.orders.length === 0) {
                results.push({
                    order_number: orderNum,
                    found: false,
                    message: 'Order not found in Shopify'
                });
                continue;
            }

            const order = data.orders[0];
            
            // Extract delivery date using same logic as sync
            let extractedDeliveryDate = null;
            const noteAttrs = order.note_attributes || [];
            const deliveryAttr = noteAttrs.find((a: any) => a.name === 'Fecha de Recolección');
            if (deliveryAttr && deliveryAttr.value) {
                const parts = deliveryAttr.value.split('/');
                if (parts.length === 3) {
                    extractedDeliveryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            results.push({
                order_number: orderNum,
                found: true,
                shopify_id: order.id,
                name: order.name,
                created_at: order.created_at,
                updated_at: order.updated_at,
                financial_status: order.financial_status,
                fulfillment_status: order.fulfillment_status,
                customer: {
                    first_name: order.customer?.first_name,
                    last_name: order.customer?.last_name,
                    email: order.customer?.email
                },
                shipping_address: {
                    city: order.shipping_address?.city,
                    province: order.shipping_address?.province
                },
                note_attributes: noteAttrs,
                extracted_delivery_date: extractedDeliveryDate || order.created_at,
                line_items_count: order.line_items?.length || 0,
                line_items_sample: order.line_items?.slice(0, 3).map((item: any) => ({
                    name: item.name,
                    sku: item.sku,
                    quantity: item.quantity,
                    current_quantity: item.current_quantity
                }))
            });
        }

        return NextResponse.json({
            requested_orders: orderNumbers,
            results: results
        });

    } catch (error: any) {
        console.error('[InspectOrders] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            message: error.message 
        }, { status: 500 });
    }
}
