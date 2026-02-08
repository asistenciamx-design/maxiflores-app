'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/?error=invalid-credentials')
    }

    redirect('/surtido')
}

export async function logout() {
    const supabase = createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
        console.error('Error signing out:', error)
        return
    }
    
    redirect('/')
}
