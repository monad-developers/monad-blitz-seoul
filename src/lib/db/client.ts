import { supabase } from './supabase';
import { SkinTraits } from '@/lib/traitGenerator';

/**
 * 데이터베이스 스킨 레코드 타입
 */
export interface SkinRecord {
    id: number;
    address: string;
    traits: SkinTraits;
    image_url: string;
    storage_path: string;
    generation_method: 'ai' | 'procedural';
    created_at: Date;
    updated_at: Date;
}

/**
 * 생성 히스토리 레코드 타입
 */
export interface GenerationHistoryRecord {
    id: number;
    address: string;
    generation_method: 'ai' | 'procedural';
    success: boolean;
    error_message: string | null;
    created_at: Date;
}

/**
 * 주소로 스킨 조회 (대소문자 무시)
 */
export async function getSkinByAddress(address: string): Promise<SkinRecord | null> {
    try {
        const { data, error } = await supabase
            .from('skins')
            .select('*')
            .ilike('address', address)
            .single();

        if (error) {
            // 레코드가 없는 경우는 에러가 아님
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data as SkinRecord;
    } catch (error) {
        console.error('[DB] Failed to get skin:', error);
        throw error;
    }
}

/**
 * 스킨 저장 (UPSERT: 존재하면 업데이트, 없으면 생성)
 */
export async function saveSkin(skinData: {
    address: string;
    traits: SkinTraits;
    imageUrl: string;
    storagePath: string;
    method: 'ai' | 'procedural';
}): Promise<SkinRecord> {
    try {
        const { data, error } = await supabase
            .from('skins')
            .upsert(
                {
                    address: skinData.address,
                    traits: skinData.traits,
                    image_url: skinData.imageUrl,
                    storage_path: skinData.storagePath,
                    generation_method: skinData.method,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'address',
                }
            )
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data as SkinRecord;
    } catch (error) {
        console.error('[DB] Failed to save skin:', error);
        throw error;
    }
}

/**
 * 스킨 삭제
 */
export async function deleteSkin(address: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('skins')
            .delete()
            .ilike('address', address);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('[DB] Failed to delete skin:', error);
        throw error;
    }
}

/**
 * 생성 히스토리 기록
 */
export async function logGeneration(data: {
    address: string;
    method: 'ai' | 'procedural';
    success: boolean;
    errorMessage?: string;
}): Promise<GenerationHistoryRecord> {
    try {
        const { data: record, error } = await supabase
            .from('generation_history')
            .insert({
                address: data.address,
                generation_method: data.method,
                success: data.success,
                error_message: data.errorMessage || null,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return record as GenerationHistoryRecord;
    } catch (error) {
        console.error('[DB] Failed to log generation:', error);
        throw error;
    }
}

/**
 * 주소별 생성 히스토리 조회
 */
export async function getGenerationHistory(
    address: string,
    limit = 10
): Promise<GenerationHistoryRecord[]> {
    try {
        const { data, error } = await supabase
            .from('generation_history')
            .select('*')
            .eq('address', address)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return data as GenerationHistoryRecord[];
    } catch (error) {
        console.error('[DB] Failed to get generation history:', error);
        throw error;
    }
}

/**
 * Storage에서 이미지 업로드
 */
export async function uploadSkinImage(
    address: string,
    imageBuffer: Buffer
): Promise<{ publicUrl: string; path: string }> {
    try {
        const path = `skins/${address}.png`;

        const { error: uploadError } = await supabase.storage
            .from('skins')
            .upload(path, imageBuffer, {
                contentType: 'image/png',
                upsert: true, // 기존 파일 덮어쓰기
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('skins')
            .getPublicUrl(path);

        return { publicUrl, path };
    } catch (error) {
        console.error('[Storage] Failed to upload skin image:', error);
        throw error;
    }
}

/**
 * Storage에서 이미지 삭제
 */
export async function deleteSkinImage(path: string): Promise<void> {
    try {
        const { error } = await supabase.storage
            .from('skins')
            .remove([path]);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('[Storage] Failed to delete skin image:', error);
        throw error;
    }
}
