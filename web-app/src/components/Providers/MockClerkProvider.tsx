'use client';

import React, { createContext, useContext } from 'react';

// Clerkのコンテキストを模倣する
const MockUserContext = createContext<any>({ user: null, isSignedIn: false, isLoaded: true });
const MockAuthContext = createContext<any>({ getToken: async () => null, userId: null });

export const MockClerkProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <MockUserContext.Provider value={{ user: null, isSignedIn: false, isLoaded: true }}>
            <MockAuthContext.Provider value={{ getToken: async () => null, userId: null }}>
                {children}
            </MockAuthContext.Provider>
        </MockUserContext.Provider>
    );
};

// これらをuseUser/useAuthの代わりに使うためのエクスポートは必要ない。
// 実際にはClerkProviderがない状態で @clerk/nextjs の useUser を呼ぶとエラーになる。
// なので、app/layout.tsx で「有効なキーがない場合はダミーを渡す」のが一番安全。
