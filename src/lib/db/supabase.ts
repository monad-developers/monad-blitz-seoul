import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 클라이언트 싱글톤
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 데이터베이스 타입 정의
 */
export interface Database {
    public: {
        Tables: {
            skins: {
                Row: {
                    id: number;
                    address: string;
                    traits: any; // JSONB
                    image_url: string;
                    storage_path: string;
                    generation_method: 'ai' | 'procedural';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    address: string;
                    traits: any;
                    image_url: string;
                    storage_path: string;
                    generation_method: 'ai' | 'procedural';
                };
                Update: {
                    traits?: any;
                    image_url?: string;
                    storage_path?: string;
                    generation_method?: 'ai' | 'procedural';
                    updated_at?: string;
                };
            };
            generation_history: {
                Row: {
                    id: number;
                    address: string;
                    generation_method: 'ai' | 'procedural';
                    success: boolean;
                    error_message: string | null;
                    created_at: string;
                };
                Insert: {
                    address: string;
                    generation_method: 'ai' | 'procedural';
                    success: boolean;
                    error_message?: string | null;
                };
            };
        };
    };
}
