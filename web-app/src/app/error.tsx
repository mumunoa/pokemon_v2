'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Next.js Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">エラーが発生しました</h2>
                <p className="text-slate-400 mb-6">
                    {error.message || 'アプリケーションの実行中に予期しないエラーが発生しました。'}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        再試行する
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-slate-500 hover:text-slate-300 transition-all text-sm"
                    >
                        ページをリロード
                    </button>
                </div>
            </div>
        </div>
    );
}
