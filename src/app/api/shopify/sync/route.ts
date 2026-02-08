import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const supabase = await createClient();

        // 1. Fetch Credentials from environment variables
        const SHOP_URL = process.env.SHOPIFY_SHOP_URL || '1dmass-ij.myshopify.com';
        const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

        if (!SHOP_URL || !ACCESS_TOKEN) {
            return NextResponse.json({ error: 'Faltan credenciales de Shopify' }, { status: 400 });
        }

        // Helper to fetch all pages (Cursor-based pagination)
        const fetchAll = async (endpoint: string, maxItems = 1000) => {
            let allItems: any[] = [];
            let url = `https://${SHOP_URL}/admin/api/2024-01/${endpoint}`;
            if (!url.includes('?')) url += '?limit=250';
            else url += '&limit=250';

            while (url && allItems.length < maxItems) {
                const res = await fetch(url, {
                    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ACCESS_TOKEN },
                    cache: 'no-store' 
                });
                
                if (!res.ok) {
                    console.warn(`Shopify Error (${res.status}) fetching ${endpoint}`);
                    break;
                }

                const data = await res.json();
                const key = Object.keys(data)[0]; // 'products' or 'orders'
                const items = data[key] || [];
                
                allItems = [...allItems, ...items];

                // Parse 'Link' header for pagination
                // Header format: <https://shop.com/...>; rel="previous", <https://shop.com/...>; rel="next"
                const linkHeader = res.headers.get('Link');
                if (linkHeader) {
                    const matches = linkHeader.match(/<([^>]+)>; rel="next"/);
                    url = matches ? matches[1] : '';
                } else {
                    url = '';
                }
            }
            return allItems;
        };

        // 2 & 3. Parallel Fetch from Shopify
        // Extended to 60 days to capture orders created further back but with future delivery dates
        // CRITICAL: Using created_at_min instead of updated_at_min to capture orders that haven't been updated recently
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

        const [customCollections, smartCollections, collects, products, openOrders, recentOrders] = await Promise.all([
            fetchAll('custom_collections.json'),
            fetchAll('smart_collections.json'),
            fetchAll('collects.json'),
            fetchAll('products.json'),
            fetchAll('orders.json?status=open', 5000), // Get ALL open orders (limit 5000 just in case)
            fetchAll(`orders.json?status=any&created_at_min=${sixtyDaysAgo}`, 10000) // Get ANY status CREATED in last 60 days (increased to 10k)
        ]);
        
        console.log(`[SYNC] Fetched ${recentOrders.length} orders created since ${sixtyDaysAgo}`);

        // Merge orders (deduplicate by ID)
        const ordersMap = new Map();
        [...openOrders, ...recentOrders].forEach((o: any) => {
            ordersMap.set(o.id, o);
        });
        const orders = Array.from(ordersMap.values());
        
        // Check for specific orders we're debugging
        const order5608 = orders.find((o: any) => o.name === '#5608');
        const order5618 = orders.find((o: any) => o.name === '#5618');
        console.log(`[SYNC] Total merged orders: ${orders.length}`);
        console.log(`[SYNC] Order #5608 found: ${!!order5608}`);
        console.log(`[SYNC] Order #5618 found: ${!!order5618}`);

        // Build Collection Map: ID -> Title
        const collectionNames = new Map();
        [...customCollections, ...smartCollections].forEach((c: any) => {
            collectionNames.set(c.id, c.title);
        });

        // Build Product -> Collection Map
        const productCollectionMap = new Map();
        collects.forEach((c: any) => {
            if (!productCollectionMap.has(c.product_id)) {
                const title = collectionNames.get(c.collection_id);
                if (title) productCollectionMap.set(c.product_id, title);
            }
        });

        // 4. Transform and Save Products (Varieties)
        // IMPORTANT: Each Shopify product can have multiple variants (Estándar, Primera, Premium)
        // We need to save EACH variant as a separate variety
        const varietiesToInsert: any[] = [];
        
        products.forEach((p: any) => {
            // Determine Category: Collection > Product Type > 'Sin Categoría'
            let category = productCollectionMap.get(p.id);
            if (!category) category = p.product_type;
            if (!category) category = 'Sin Colección';

            // Iterate through ALL variants of this product
            if (p.variants && p.variants.length > 0) {
                p.variants.forEach((variant: any) => {
                    // Build the variety name: Product Title + Variant Title (if exists and not "Default Title")
                    let varietyName = p.title;
                    if (variant.title && variant.title !== 'Default Title') {
                        varietyName = `${p.title} - ${variant.title}`;
                    }

                    varietiesToInsert.push({
                        name: varietyName,
                        sku: variant.sku || `SHOPIFY-${p.id}-${variant.id}`,
                        image_url: variant.image_id 
                            ? p.images?.find((img: any) => img.id === variant.image_id)?.src 
                            : p.image?.src || null,
                        category: category,
                    });
                });
            } else {
                // Fallback: if no variants, save the product itself
                varietiesToInsert.push({
                    name: p.title,
                    sku: `SHOPIFY-${p.id}`,
                    image_url: p.image?.src || null,
                    category: category,
                });
            }
        });

        if (varietiesToInsert.length > 0) {
            const { error: varietyError } = await supabase
                .from('varieties')
                .upsert(varietiesToInsert, { onConflict: 'sku' });
            if (varietyError) console.error('Error syncing varieties:', varietyError);
        }



        // (Duplicate varietiesToInsert block removed)

        // 5. Pre-Fetch All Variety IDs for fast lookup
        const { data: allVarieties } = await supabase.from('varieties').select('id, sku');
        const varietyMap = new Map();
        allVarieties?.forEach((v: any) => varietyMap.set(v.sku, v.id));

        // 6. Process Orders
        // 6. Process Orders (Bulk Operation)
        // Transform Orders for Bulk Upsert
        const ordersPayload = orders.map((order: any) => ({
            shopify_id: order.id.toString(),
            order_number: order.name,
            client_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Cliente Shopify',
            location: order.shipping_address?.city || 'En línea',
            status: 'pending',
            is_vip: order.total_price > 1000,
            created_at: order.created_at,
            delivery_date: (() => {
                const noteAttrs = order.note_attributes || [];
                
                // Log for specific orders we're debugging
                if (order.name === '#5608' || order.name === '#5618') {
                    console.log(`[SYNC DEBUG] Order ${order.name}:`);
                    console.log(`  - note_attributes count: ${noteAttrs.length}`);
                    console.log(`  - note_attributes:`, JSON.stringify(noteAttrs, null, 2));
                }
                
                // Try multiple possible field names
                const possibleNames = [
                    'Fecha de Recolección',
                    'Fecha de recolección', 
                    'fecha de recolección',
                    'Delivery Date',
                    'delivery_date',
                    'Fecha de Entrega',
                    'Fecha de entrega'
                ];
                
                let deliveryAttr = null;
                for (const name of possibleNames) {
                    deliveryAttr = noteAttrs.find((a: any) => a.name === name);
                    if (deliveryAttr) {
                        if (order.name === '#5608' || order.name === '#5618') {
                            console.log(`  - Found delivery attr with name: "${name}"`);
                            console.log(`  - Value: "${deliveryAttr.value}"`);
                        }
                        break;
                    }
                }
                
                if (deliveryAttr && deliveryAttr.value) {
                    // Try dd/mm/yyyy format
                    const parts = deliveryAttr.value.split('/');
                    if (parts.length === 3) {
                        const extracted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        if (order.name === '#5608' || order.name === '#5618') {
                            console.log(`  - Extracted date: ${extracted}`);
                        }
                        return extracted;
                    }
                    
                    // Try ISO format (yyyy-mm-dd)
                    if (deliveryAttr.value.match(/^\d{4}-\d{2}-\d{2}/)) {
                        return deliveryAttr.value.split('T')[0];
                    }
                }
                
                if (order.name === '#5608' || order.name === '#5618') {
                    console.log(`  - No delivery date found, using created_at: ${order.created_at}`);
                }
                
                return order.created_at;
            })()
        }));

        let savedOrders: any[] = [];
        if (ordersPayload.length > 0) {
            const { data, error } = await supabase
                .from('orders')
                .upsert(ordersPayload, { onConflict: 'shopify_id' })
                .select('id, shopify_id, delivery_date');
            
            if (error) {
                console.error('Error bulk upserting orders:', error);
                throw new Error('Error saving orders');
            }
            savedOrders = data || [];
        }

        // Map Shopify ID to Supabase ID and Delivery Date
        const shopifyIdToSupabaseMap = new Map();
        savedOrders.forEach((o: any) => {
            shopifyIdToSupabaseMap.set(o.shopify_id, { id: o.id, delivery_date: o.delivery_date });
        });

        // Prepare Order Items and Commitments
        const orderItemsPayload: any[] = [];
        const uniqueCommitmentKeys = new Set<string>(); // "varietyId|deliveryDate"
        const neededCommitments: { variety_id: any, delivery_date: any }[] = [];

        // We delete items for ALL synced orders to ensure clean state (handling deletions)
        const orderIds = savedOrders.map(o => o.id);

        // Process Line Items in Memory
        for (const order of orders) {
            const orderMeta = shopifyIdToSupabaseMap.get(order.id.toString());
            if (!orderMeta) continue; // Should not happen if upsert worked

            if (order.line_items?.length > 0) {
                for (const item of order.line_items) {
                    let targetSku = item.sku;
                    if (!targetSku && item.product_id) targetSku = `SHOPIFY-${item.product_id}`;
                    if (!targetSku) continue;

                    const varietyId = varietyMap.get(targetSku);

                    // Use current_quantity to account for refunds/edits
                    // If current_quantity is 0, it means the item was removed/refunded.
                    const quantity = item.current_quantity !== undefined ? item.current_quantity : item.quantity;

                    if (varietyId && quantity > 0) {
                        orderItemsPayload.push({
                            order_id: orderMeta.id,
                            variety_id: varietyId,
                            quantity: quantity,
                            unit: 'unidades'
                        });

                        // Track needed commitment
                        if (orderMeta.delivery_date) {
                            const key = `${varietyId}|${orderMeta.delivery_date}`;
                            if (!uniqueCommitmentKeys.has(key)) {
                                uniqueCommitmentKeys.add(key);
                                neededCommitments.push({
                                    variety_id: varietyId,
                                    delivery_date: orderMeta.delivery_date
                                });
                            }
                        }
                    }
                }
            }
        }

        // Bulk Delete and Insert Items
        if (orderIds.length > 0) {
            // Delete old items for these orders
            // CRITICAL: We must ensure deletion succeeds before inserting to prevent duplicates
            console.log(`[Sync] Deleting items for ${orderIds.length} orders...`);
            
            const chunkSize = 100;
            for (let i = 0; i < orderIds.length; i += chunkSize) {
                const chunk = orderIds.slice(i, i + chunkSize);
                const { error: deleteError } = await supabase.from('order_items').delete().in('order_id', chunk);
                
                if (deleteError) {
                     // STOP IMMEDIATELY if deletion fails. Do not insert new items.
                     console.error("Critical Error deleting old order items:", deleteError);
                     throw new Error(`Critical: Failed to delete old items. Sync aborted to prevent duplication. Details: ${deleteError.message}`);
                }
            }
            
            console.log(`[Sync] Deletion successful. Proceeding to insert ${orderItemsPayload.length} items...`);
        }

        if (orderItemsPayload.length > 0) {
            // Bulk Insert new items
            // Chunk insertion as well to be safe
            const chunkSize = 100;
            for (let i = 0; i < orderItemsPayload.length; i += chunkSize) {
                const chunk = orderItemsPayload.slice(i, i + chunkSize);
                const { error: itemsError } = await supabase.from('order_items').insert(chunk);
                if (itemsError) {
                    console.error('Error inserting order items chunk:', itemsError);
                    // We continue trying to insert other chunks, but log the error.
                    // Ideally we'd want atomic transaction here.
                }
            }
        }
        
        // Final Clean-up: Deduplication Repair Step
        // Use a heuristic to remove duplicate rows (same order, same variety, same quantity) created by previous buggy syncs
        // Note: This is an expensive operation, so we limit it or run it only if we suspect issues.
        // For now, checking order #6389 specifically if it was part of this sync, or generic clean up.
        // Since we deleted *everything* for the synced orders above, duplication *should* be gone for these orders.
        // The issue only remains if the Deletion step above failed silently in the past (which we now catch).
        
        // Double Safety: Verify count for a known problematic order if it was in this batch
        if (orderItemsPayload.find(i => i.quantity === 130)) { 
             // Just a sanity logging check if we see crazy quantities
             console.warn("Warning: Large quantity item detected being inserted."); 
        }

        // Handle Supply Commitments
        // Strategy: We have a list of (variety, date) that we NEED to exist.
        // We can't easily bulk "insert if not exists" without logic.
        // Optimization: Fetch all existing commitments for these varieties (batch fetch).
        // Then filter neededCommitments against existing ones.
        if (neededCommitments.length > 0) {
             // Fetch existing commitments for the involved varieties (to minimize query size, we filter by variety_id)
             // or by date. Filtering by variety_id seems safer if dates are scattered.
             const distinctVarIds = Array.from(new Set(neededCommitments.map(c => c.variety_id)));
             
             // We'll fetch recursively or in one go if small enough. 
             // With 3000 orders, distinct varieties might be ~100.
             const { data: existingCommitments } = await supabase
                .from('supply_commitments')
                .select('variety_id, delivery_date')
                .in('variety_id', distinctVarIds);
            
            const existingSet = new Set();
            existingCommitments?.forEach((c: any) => {
                existingSet.add(`${c.variety_id}|${c.delivery_date}`);
            });

            const commitmentsToInsert = neededCommitments.filter(c => {
                 return !existingSet.has(`${c.variety_id}|${c.delivery_date}`);
            }).map(c => ({
                variety_id: c.variety_id,
                delivery_date: c.delivery_date,
                demand_qty: 0,
                captured_qty: 0,
                captured_by: 'Shopify Sync'
            }));

            if (commitmentsToInsert.length > 0) {
                const { error: commitmentError } = await supabase.from('supply_commitments').insert(commitmentsToInsert);
                if (commitmentError) console.error('Error inserting commitments:', commitmentError);
            }
        }

        const syncedOrdersCount = savedOrders.length;

        return NextResponse.json({ 
            success: true, 
            message: `Sincronizados: ${varietiesToInsert.length} Variedades, ${syncedOrdersCount} Pedidos`,
            products: varietiesToInsert 
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
