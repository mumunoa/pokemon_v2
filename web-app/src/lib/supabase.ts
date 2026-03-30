import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 初期化でクラッシュするのを防ぐためにtry-catchで囲む
let supabaseInstance = null;
try {
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
} catch (e) {
    console.error('Supabase Initialization Error:', e);
}

export const supabase = supabaseInstance;

let cachedClient: any = null;
let lastToken: string | null = null;

export const createSupabaseClient = (clerkToken?: string) => {
    try {
        if (!supabaseUrl || !supabaseAnonKey) return null;

        // トークンが変わらない場合はキャッシュを返す
        if (cachedClient && lastToken === (clerkToken || null)) {
            return cachedClient;
        }

        const client = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: clerkToken ? {
                    Authorization: `Bearer ${clerkToken}`,
                } : {},
            },
        });

        cachedClient = client;
        lastToken = clerkToken || null;
        return client;
    } catch (e) {
        console.error('Supabase Client Creation Error:', e);
        return null;
    }
};

if (!supabase) {
    console.warn('Supabase credentials missing or invalid. Data sync will be disabled.');
}
