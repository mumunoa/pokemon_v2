import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const UpgradePrompt: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Background */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-purple-600/20 to-transparent"></div>
                
                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-purple-500/40 mb-6 transform -rotate-6">
                        🚀
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                        Pro コーチを解禁
                    </h2>
                    
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                        「なぜその手が最善なのか」の論理的解説と、<br/>
                        相手の手札推定・リスク分析をすべて開放します。
                    </p>

                    {/* Features List */}
                    <div className="w-full space-y-3 mb-8">
                        {[
                            { icon: '🎯', text: '最全手順の論理的解説（Pros/Cons）' },
                            { icon: '👁️', text: '相手の手札・サイドの中身推定' },
                            { icon: '📉', text: '次ターンの負け筋・リスク分析' },
                            { icon: '🧠', text: '過去のプレイ履歴に基づく癖の矯正' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-left">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-xs text-slate-200 font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full space-y-3">
                        <button 
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95"
                            onClick={() => window.location.href = '/billing'}
                        >
                            初月無料で Pro を試す
                        </button>
                        
                        <button 
                            className="w-full py-3 text-slate-500 text-xs font-bold hover:text-slate-300 transition-colors"
                            onClick={onClose}
                        >
                            今はまだ大丈夫です
                        </button>
                    </div>

                    <p className="mt-6 text-[10px] text-slate-600 italic">
                        ※いつでもキャンセル可能です
                    </p>
                </div>
            </div>
        </div>
    );
};
