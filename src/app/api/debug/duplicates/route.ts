
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    
    // Check duplicates for general repeated items
    const { data: duplicates } = await supabase
        .from('order_items')
        .select(`
            id,
            quantity,
            order_id,
            variety_id
        `)
        .limit(100);

    // Specific check for order #6559
    const { data: order6559 } = await supabase
        .from('orders')
        .select(`
            id,
            order_number,
            created_at,
            order_items (
                id, 
                quantity,
                variety_id
            )
        `)
        .ilike('order_number', '%6559%');

    return NextResponse.json({ 
        duplicates_sample: duplicates,
        order_6559_analysis: order6559
    });
}
