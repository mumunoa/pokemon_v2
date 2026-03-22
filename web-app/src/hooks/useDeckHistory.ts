import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface SavedDeck {
    code: string;
    name?: string;
    pinned?: boolean;
    updatedAt: number;
}

export function useDeckHistory() {
    const { isPro } = useAuth();
    const [history, setHistory] = useState<SavedDeck[]>([]);
    
    // 初回マウント時にlocalStorageから読み込む
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

    // 履歴を保存する（上限管理とソート仕様）
    const saveHistory = (newHistory: SavedDeck[]) => {
        const limit = isPro ? 20 : 4;
        
        // Pinnedを上に、その後更新日時が新しいものを上にする
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
        setHistory(prev => {
            const existing = prev.find(h => h.code === code);
            const newEntry = existing 
                ? { ...existing, updatedAt: Date.now() } 
                : { code, updatedAt: Date.now() };
            
            const newHistory = [newEntry, ...prev.filter(h => h.code !== code)];
            const limit = isPro ? 20 : 4;
            const sorted = newHistory.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.updatedAt - a.updatedAt;
            });
            const trimmed = sorted.slice(0, limit);
            if (typeof window !== 'undefined') {
                localStorage.setItem('guest_deck_history', JSON.stringify(trimmed));
            }
            return trimmed;
        });
    };

    const updateDeckName = (code: string, name: string) => {
        setHistory(prev => {
            const newHistory = prev.map(h => h.code === code ? { ...h, name } : h);
            if (typeof window !== 'undefined') {
                localStorage.setItem('guest_deck_history', JSON.stringify(newHistory));
            }
            return newHistory;
        });
    };

    const togglePin = (code: string) => {
        setHistory(prev => {
            const newHistory = prev.map(h => h.code === code ? { ...h, pinned: !h.pinned } : h);
            const limit = isPro ? 20 : 4;
            const sorted = newHistory.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.updatedAt - a.updatedAt;
            });
            const trimmed = sorted.slice(0, limit);
            if (typeof window !== 'undefined') {
                localStorage.setItem('guest_deck_history', JSON.stringify(trimmed));
            }
            return trimmed;
        });
    };

    const removeDeck = (code: string) => {
        setHistory(prev => {
            const newHistory = prev.filter(h => h.code !== code);
            if (typeof window !== 'undefined') {
                localStorage.setItem('guest_deck_history', JSON.stringify(newHistory));
            }
            return newHistory;
        });
    };

    return { history, addDeck, updateDeckName, togglePin, removeDeck };
}
