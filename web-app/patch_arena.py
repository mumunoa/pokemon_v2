import re

with open('src/features/practice/components/Board/Arena.tsx', 'r') as f:
    lines = f.readlines()

# Locate line 665 (return () start)
for i, line in enumerate(lines):
    if line.strip() == "return (":
        return_idx = i
        break

player_field_func = """
    const renderPlayerField = (playerId: PlayerId, isOpponent: boolean) => {
        return (
            <div className={`field ${playerId}-field flex-1 relative flex flex-col justify-center p-2 overflow-visible ${isOpponent ? 'scale-75 origin-top opacity-80 mt-2' : 'mb-[120px] border-glow'}`}>
                <div className="active-row flex justify-center items-center w-full max-w-4xl mx-auto space-x-6 sm:space-x-8">

                    <div className="relative">
                        <Zone id={`${playerId}-prizes` as ZoneType} className="prizes-zone horizontal-prizes relative w-[100px] h-[140px] border border-dashed border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setPopupState({ zone: `${playerId}-prizes` as ZoneType })}>
                            <div className="zone-label absolute top-[-25px] left-0 w-full text-center text-white text-xs z-50">サイド</div>
                            {zones[`${playerId}-prizes` as ZoneType].length > 0 && (
                                <div className="absolute -bottom-3 -right-3 w-7 h-7 bg-red-600 border-2 border-slate-900 text-white font-bold text-sm rounded-full flex items-center justify-center z-[1001] shadow-lg">
                                    {zones[`${playerId}-prizes` as ZoneType].length}
                                </div>
                            )}
                            {renderCardsInZone(playerId, `${playerId}-prizes` as ZoneType, false, true)}
                            <div className="absolute inset-0 z-40" onClick={(e) => { e.stopPropagation(); setPopupState({ zone: `${playerId}-prizes` as ZoneType }); }}></div>
                        </Zone>
                    </div>

                    <div className="relative">
                        {zones[`${playerId}-active` as ZoneType].find(id => cards[id]?.type === 'pokemon') && (
                            <div className="absolute -top-3 -right-6 flex flex-col space-y-2 z-[1000] opacity-80 hover:opacity-100 transition-opacity">
                                <button className="bg-red-900 p-1 rounded-full shadow-lg border border-red-700 hover:bg-red-800 text-white" onClick={(e) => { e.stopPropagation(); handleTrashActive(playerId); }} title="トラッシュへ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                </button>
                                <button className="bg-green-700 p-1 rounded-full shadow-lg border border-green-600 hover:bg-green-600 text-white" onClick={(e) => { e.stopPropagation(); handleEscapeActive(playerId); }} title="にげる・入れ替え">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" /></svg>
                                </button>
                            </div>
                        )}

                        <Zone id={`${playerId}-active` as ZoneType} className="battle-zone w-[100px] h-[140px] border-2 border-yellow-500 rounded-md bg-slate-800/80 flex items-center justify-center relative">
                            {zones[`${playerId}-active` as ZoneType].length > 0 ? renderCardsInZone(playerId, `${playerId}-active` as ZoneType) : <div className="text-white opacity-30 text-xs font-bold">バトル場</div>}
                        </Zone>
                    </div>

                    <div className="deck-trash-zone flex space-x-4 relative">
                        <div className="flex flex-col items-center relative">
                            <div className="absolute -top-3 -right-6 flex flex-col space-y-2 z-[1002] opacity-80 hover:opacity-100 transition-opacity">
                                <button className="bg-blue-600 p-1 rounded-full shadow-lg border border-blue-500 hover:bg-blue-500 text-white" onClick={(e) => { e.stopPropagation(); handleDraw1(playerId); }} title="1枚ドロー">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                                </button>
                                <button className="bg-slate-600 p-1 rounded-full shadow-lg border border-slate-500 hover:bg-slate-500 text-white" onClick={(e) => { e.stopPropagation(); handleShuffleAnimation(playerId); }} title="シャッフル">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
                                </button>
                            </div>

                            <Zone id={`${playerId}-deck` as ZoneType} className="deck-zone horizontal-card w-[100px] h-[140px] relative border border-solid border-slate-600 flex items-center justify-center hover:border-slate-400 cursor-pointer" onClick={() => setPopupState({ zone: `${playerId}-deck` as ZoneType, viewMode: 'all' })}>
                                <div className="zone-label absolute top-[-25px] w-full text-center text-white text-xs">山札</div>
                                {zones[`${playerId}-deck` as ZoneType].length > 0 && (
                                    <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-slate-700 border border-slate-900 text-white font-bold text-[10px] rounded-full flex items-center justify-center z-[1001] shadow-md">
                                        {zones[`${playerId}-deck` as ZoneType].length}
                                    </div>
                                )}
                                <div className={`deck-stack player1-card-back w-[90%] h-[92%] absolute bg-slate-700 rounded-md shadow-md ${isShuffling ? 'animate-shuffle' : ''}`} style={{ backgroundImage: "url('https://www.pokemon-card.com/assets/images/card_images/back.png')", backgroundSize: "cover" }} />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 rounded transition-opacity">
                                    <span className="text-white text-xs font-bold text-center">タップで<br />アクション<br />を見る</span>
                                </div>
                            </Zone>

                            {isDrawing && (
                                <div className="absolute z-[9999] pointer-events-none" style={{
                                    top: '0', left: '0', width: '90%', height: '92%',
                                    animation: 'drawAnim 0.5s ease-out forwards'
                                }}>
                                    <div className="w-full h-full rounded-md shadow-xl" style={{ backgroundImage: "url('https://www.pokemon-card.com/assets/images/card_images/back.png')", backgroundSize: "cover" }} />
                                </div>
                            )}
                        </div>

                        <Zone id={`${playerId}-trash` as ZoneType} className="trash-zone horizontal-card w-[100px] h-[140px] relative border border-solid border-slate-500 bg-slate-800/40 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setPopupState({ zone: `${playerId}-trash` as ZoneType })}>
                            <div className="zone-label absolute top-[-25px] w-full text-center text-white text-xs">トラッシュ</div>
                            {zones[`${playerId}-trash` as ZoneType].length > 0 && (
                                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-slate-700 border border-slate-900 text-white font-bold text-[10px] rounded-full flex items-center justify-center z-[1001] shadow-md">
                                    {zones[`${playerId}-trash` as ZoneType].length}
                                </div>
                            )}
                            {renderCardsInZone(playerId, `${playerId}-trash` as ZoneType, true)}
                            <div className="absolute inset-0 z-40" onClick={(e) => { e.stopPropagation(); setPopupState({ zone: `${playerId}-trash` as ZoneType }); }}></div>
                        </Zone>
                    </div>
                </div>

                <div className="bench-row flex justify-center mt-6 w-full max-w-4xl mx-auto">
                    <div className="bench-zone flex space-x-2 p-2 bg-slate-800/40 rounded-lg">
                        {([1, 2, 3, 4, 5] as const).map(num => {
                            const bZone = `${playerId}-bench-${num}` as ZoneType;
                            const hasPoke = escapePlayerId === playerId && zones[bZone].find(id => cards[id]?.type === 'pokemon');
                            const outlineClass = hasPoke ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-pulse cursor-pointer z-[5001]' : 'border-slate-600';
                            const benchHasPokemon = zones[bZone].find(id => cards[id]?.type === 'pokemon');

                            const renderBenchArea = () => (
                                <div className="relative">
                                    {benchHasPokemon && (
                                        <div className="absolute -top-3 -right-3 z-[1000] opacity-80 hover:opacity-100 transition-opacity flex flex-col space-y-1">
                                            <button
                                                className="bg-red-900 p-1 rounded-full shadow-lg border border-red-700 hover:bg-red-800 text-white"
                                                onClick={(e) => { e.stopPropagation(); handleTrashBench(playerId, bZone); }}
                                                title="トラッシュへ"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                            </button>
                                            <button
                                                className="bg-blue-700 p-1 rounded-full shadow-lg border border-blue-500 hover:bg-blue-600 text-white"
                                                onClick={(e) => { e.stopPropagation(); handleBenchSlotClick(playerId, bZone); }}
                                                title="バトル場と入れ替え"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.31 1.97-.81 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.31-1.97.81-2.8L5.35 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" /></svg>
                                            </button>
                                        </div>
                                    )}
                                    <Zone id={bZone} className={`bench-slot w-[100px] h-[140px] bg-slate-800/80 rounded-md border ${outlineClass} relative overflow-visible flex items-center justify-center`} onClick={() => escapePlayerId === playerId && handleBenchSlotClick(playerId, bZone)}>
                                        {escapePlayerId === playerId && <div className="absolute inset-0 z-[5002]" />}
                                        {renderCardsInZone(playerId, bZone)}
                                    </Zone>
                                </div>
                            );

                            return <React.Fragment key={`bench-${num}`}>{renderBenchArea()}</React.Fragment>;
                        })}
                    </div>
                </div>

                {!isOpponent && (
                    <Zone id={`${playerId}-hand` as ZoneType} className={`${playerId}-hand absolute bottom-0 left-0 w-full h-[120px] bg-slate-900/90 border-t border-slate-700 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center space-x-[-20px] overflow-visible z-50 pb-2`}>
                        <div className="absolute -top-10 right-4 flex space-x-2 z-[60] bg-slate-800/80 p-1.5 rounded-lg border border-slate-600 shadow-xl backdrop-blur-sm">
                            <button className="bg-slate-700 hover:bg-slate-600 text-white p-1 rounded-full shadow border border-slate-500 transition-colors" onClick={handleUndo} title="1つ手前へ戻る (Undo)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                            </button>
                            <button className="bg-slate-700 hover:bg-slate-600 text-white p-1 rounded-full shadow border border-slate-500 transition-colors" onClick={handleRedo} title="1つ先へ進める (Redo)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>
                            </button>
                            <span className="w-px bg-slate-600 py-1" />
                            <button className="bg-green-700 hover:bg-green-600 px-3 py-1 text-xs text-white rounded shadow font-bold border border-green-500 transition-colors" onClick={() => handleDraw1(playerId)}>ドロー</button>
                            <button className="bg-blue-700 hover:bg-blue-600 px-3 py-1 text-xs text-white rounded shadow font-bold border border-blue-500 transition-colors" onClick={() => handleJudge(playerId)}>ジャッジマン</button>
                            <button className="bg-purple-700 hover:bg-purple-600 px-3 py-1 text-xs text-white rounded shadow font-bold border border-purple-500 transition-colors" onClick={() => handleProfResearch(playerId)}>博士の研究</button>
                        </div>
                        <div className="absolute top-2 right-4 text-slate-400 text-xs font-bold font-mono bg-slate-800 px-2 py-1 rounded-full border border-slate-700 shadow-inner">
                            手札 : {zones[`${playerId}-hand` as ZoneType].length}
                        </div>
                        {renderHandCards(playerId)}
                    </Zone>
                )}
            </div>
        );
    };
"""

lines.insert(return_idx, player_field_func)

with open('src/features/practice/components/Board/Arena.tsx', 'w') as f:
    f.writelines(lines)

