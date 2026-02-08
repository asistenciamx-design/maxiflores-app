'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCommitment(
    commitmentId: string | undefined, 
    varietyId: string, 
    date: string, 
    newQty: number
) {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // Attempt to get user name from metadata or fall back to email
    const capturedBy = user.user_metadata?.full_name || user.email || 'Usuario';

    // If we have an ID, update it
    if (commitmentId) {
        const { error } = await supabase
            .from('supply_commitments')
            .update({
                captured_qty: newQty,
                captured_by: capturedBy
            })
            .eq('id', commitmentId);

        if (error) {
            console.error('Error updating commitment:', error);
            throw new Error('Failed to update');
        }
    } else {
        // Create new commitment
        const { error } = await supabase
            .from('supply_commitments')
            .insert({
                variety_id: varietyId,
                delivery_date: date,
                captured_qty: newQty,
                captured_by: capturedBy,
                status: 'pending' // Default status
            });

        if (error) {
            console.error('Error creating commitment:', error);
            throw new Error('Failed to create');
        }
    }

    revalidatePath('/compromiso');
    return { success: true };
}
