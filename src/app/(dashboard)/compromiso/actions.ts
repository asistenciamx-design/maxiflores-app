'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCommitment(id: string, newQty: number) {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // Attempt to get user name from metadata or fall back to email
    const capturedBy = user.user_metadata?.full_name || user.email || 'Usuario';

    const { error } = await supabase
        .from('supply_commitments')
        .update({
            captured_qty: newQty,
            captured_by: capturedBy
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating commitment:', error);
        throw new Error('Failed to update');
    }

    revalidatePath('/compromiso');
    return { success: true };
}
