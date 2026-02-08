
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    
    // Find order
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                id,
                quantity,
                unit,
                varieties (
                    name,
                    sku
                )
            )
        `)
        .ilike('order_number', '%6389%');

    return NextResponse.json({ orders });
}
