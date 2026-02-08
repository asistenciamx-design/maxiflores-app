import { NextRequest, NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';

export async function GET(req: NextRequest) {
    // Use environment variables for credentials
    const SHOP_URL = process.env.SHOPIFY_SHOP_URL || '1dmass-ij.myshopify.com';

    try {
        // Calculate 60 days ago (same as sync)
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const today = new Date().toISOString();
        
        console.log(`[SyncTest] Testing sync query`);
        console.log(`[SyncTest] 60 days ago: ${sixtyDaysAgo}`);
        console.log(`[SyncTest] Today: ${today}`);

        // Test the exact query used in sync
        const endpoint = `orders.json?status=any&created_at_min=${sixtyDaysAgo}&limit=250`;
        const url = `https://${SHOP_URL}/admin/api/2024-01/${endpoint}`;
        
        console.log(`[SyncTest] Query URL: ${url}`);

        const response = await shopifyFetch<any>(endpoint);

        if (!response.ok) {
            console.error(`[SyncTest] Shopify API error: ${response.status}`);
            return NextResponse.json({ 
                error: `Shopify API returned ${response.status}`,
                details: response.details,
                query_used: url,
                sixty_days_ago: sixtyDaysAgo
            }, { status: response.status });
        }

        const data = response.data;
        const orders = data.orders || [];
        
        console.log(`[SyncTest] Retrieved ${orders.length} orders`);

        // Look for our specific orders
        const order5608 = orders.find((o: any) => o.name === '#5608');
        const order5618 = orders.find((o: any) => o.name === '#5618');
        
        // Get all order numbers for reference
        const orderNumbers = orders.map((o: any) => ({
            name: o.name,
            created_at: o.created_at,
            updated_at: o.updated_at,
            financial_status: o.financial_status,
            fulfillment_status: o.fulfillment_status
        }));

        // Filter orders created on Jan 14
        const jan14Orders = orders.filter((o: any) => {
            const createdDate = new Date(o.created_at);
            return createdDate.getMonth() === 0 && createdDate.getDate() === 14;
        });

        return NextResponse.json({
            test_info: {
                sixty_days_ago: sixtyDaysAgo,
                today: today,
                query_url: url
            },
            results: {
                total_orders_retrieved: orders.length,
                order_5608_found: !!order5608,
                order_5608_data: order5608 ? {
                    name: order5608.name,
                    created_at: order5608.created_at,
                    updated_at: order5608.updated_at,
                    financial_status: order5608.financial_status,
                    fulfillment_status: order5608.fulfillment_status,
                    line_items_count: order5608.line_items?.length,
                    note_attributes: order5608.note_attributes
                } : null,
                order_5618_found: !!order5618,
                order_5618_data: order5618 ? {
                    name: order5618.name,
                    created_at: order5618.created_at,
                    updated_at: order5618.updated_at,
                    financial_status: order5618.financial_status,
                    fulfillment_status: order5618.fulfillment_status,
                    line_items_count: order5618.line_items?.length,
                    note_attributes: order5618.note_attributes
                } : null,
                jan_14_orders_count: jan14Orders.length,
                jan_14_orders: jan14Orders.map((o: any) => o.name),
                all_order_numbers: orderNumbers.slice(0, 20) // First 20 for reference
            }
        });

    } catch (error: any) {
        console.error('[SyncTest] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            message: error.message 
        }, { status: 500 });
    }
}
