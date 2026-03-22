import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase';

export interface SavedDeck {
    code: string;
    name?: string;
    pinned?: boolean;
    updatedAt: number;
}

export function useDeckHistory() {
    const { isPro, isSignedIn, user, getToken } = useAuth();
    const [history, setHistory] = useState<SavedDeck[]>([]);
    
    // DBから同期する
    const syncFromDb = useCallback(async () => {
        if (!isSignedIn || !user) return;
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const supabase = createSupabaseClient(token);
            if (!supabase) return;

            const { data, error } = await supabase
                .from('user_decks')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            if (data) {
                const dbDecks: SavedDeck[] = data.map(d => ({
                    code: d.code,
                    name: d.name || undefined,
                    pinned: d.pinned,
                    updatedAt: new Date(d.updated_at).getTime()
                }));
                // ローカルとマージ（Pinned優先）
                setHistory(prev => {
                    const combined = [...dbDecks];
                    prev.forEach(p => {
                        if (!combined.find(c => c.code === p.code)) {
                            combined.push(p);
                        }
                    });
                    const sorted = combined.sort((a, b) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return b.updatedAt - a.updatedAt;
                    });
                    return sorted.slice(0, isPro ? 20 : 4);
                });
            }
        } catch (e) {
            console.error('Failed to sync from Supabase', e);
        }
    }, [isSignedIn, user, isPro, getToken]);

    // DBへ保存する
    const saveToDb = async (deck: SavedDeck) => {
        if (!isSignedIn || !user) return;
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const supabase = createSupabaseClient(token);
            if (!supabase) return;

            await supabase
                .from('user_decks')
                .upsert({
                    user_id: user.id,
                    code: deck.code,
                    name: deck.name || null,
                    pinned: deck.pinned || false,
                    updated_at: new Date(deck.updatedAt).toISOString()
                }, { onConflict: 'user_id,code' });
        } catch (e) {
            console.error('Failed to save to Supabase', e);
        }
    };

    const deleteFromDb = async (code: string) => {
        if (!isSignedIn || !user) return;
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const supabase = createSupabaseClient(token);
            if (!supabase) return;

            await supabase
                .from('user_decks')
                .delete()
                .eq('user_id', user.id)
                .eq('code', code);
        } catch (e) {
            console.error('Failed to delete from Supabase', e);
        }
    };

    // 初回マウント時にlocalStorageから読み込み、その後サインインしていればDB同期
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('guest_deck_history');
            if (stored) {
                try {
                    setHistory(JSON.parse(stored));
                } catch (e) {
                    console.error('Failed to parse deck history', e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (isSignedIn) syncFromDb();
    }, [isSignedIn, syncFromDb]);

    // 履歴を保存する（上限管理とソート仕様）
    const updateLocalHistory = (newHistory: SavedDeck[]) => {
        const limit = isPro ? 20 : 4;
        const sorted = [...newHistory].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.updatedAt - a.updatedAt;
        });
        const trimmed = sorted.slice(0, limit);
        setHistory(trimmed);
        if (typeof window !== 'undefined') {
            localStorage.setItem('guest_deck_history', JSON.stringify(trimmed));
        }
    };

    const addDeck = (code: string) => {
        const timestamp = Date.now();
        setHistory(prev => {
            const existing = prev.find(h => h.code === code);
            const newEntry = existing 
                ? { ...existing, updatedAt: timestamp } 
                : { code, updatedAt: timestamp };
            
            saveToDb(newEntry);
            const newHistory = [newEntry, ...prev.filter(h => h.code !== code)];
            updateLocalHistory(newHistory);
            return prev; // updateLocalHistory sets it
        });
        syncFromDb(); // Re-sync to be sure
    };

    const updateDeckName = (code: string, name: string) => {
        setHistory(prev => {
            const updated = prev.find(h => h.code === code);
            if (updated) saveToDb({ ...updated, name });
            const newHistory = prev.map(h => h.code === code ? { ...h, name } : h);
            updateLocalHistory(newHistory);
            return newHistory;
        });
    };

    const togglePin = (code: string) => {
        setHistory(prev => {
            const updated = prev.find(h => h.code === code);
            if (updated) saveToDb({ ...updated, pinned: !updated.pinned });
            const newHistory = prev.map(h => h.code === code ? { ...h, pinned: !h.pinned } : h);
            updateLocalHistory(newHistory);
            return newHistory;
        });
    };

    const removeDeck = (code: string) => {
        deleteFromDb(code);
        setHistory(prev => {
            const newHistory = prev.filter(h => h.code !== code);
            updateLocalHistory(newHistory);
            return newHistory;
        });
    };

    return { history, addDeck, updateDeckName, togglePin, removeDeck };
}
