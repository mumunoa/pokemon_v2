import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { 
    InitialSimulationRequest, 
    InitialSimulationResponse 
} from '@/types/simulation';
import { MonteCarloDeckSimulator } from '@/lib/simulation/engine/MonteCarloDeckSimulator';
import { SimulationStatsAggregator } from '@/lib/simulation/analysis/SimulationStatsAggregator';
import { DeckImprovementAdvisor } from '@/lib/simulation/analysis/DeckImprovementAdvisor';
import { createSupabaseClient } from '@/lib/supabase';
import { ArchetypePresetCatalog } from '@/lib/simulation/catalog/ArchetypePresetCatalog';
import { generateDeckAdvice, registerAdviceSupabaseClient } from '@/lib/simulation/analysis/DeckAdviceEngine';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        const body: InitialSimulationRequest = await req.json();

        // [デバッグ用] 60枚のカード情報をコンソールに出力 (name, type, kinds, id などを確認するため)
        console.log("=== [DEBUG] 60枚のデッキカード情報 ===");
        body.deck.forEach((card, i) => {
            console.log(`[${i + 1}] ID:${card.id} | Name: ${card.name} | Type: ${card.type} | Kinds: ${card.kinds} | Count: ${card.count}`);
        });
        console.log("======================================");

        const { userId } = getAuth(req);

        // プラン情報の取得
        let planType: 'free' | 'pro' | 'elite' = 'free';
        const supabase = createSupabaseClient();
        
        if (userId && supabase) {
            const { data: user } = await supabase
                .from('users')
                .select('plan_type, pro_trial_until')
                .eq('id', userId)
                .single();
            
            if (user) {
                const now = new Date();
                const isTrialActive = user.pro_trial_until && new Date(user.pro_trial_until) > now;
                planType = (user.plan_type as 'free' | 'pro' | 'elite') || 'free';
                if (isTrialActive && planType === 'free') planType = 'pro';
            }
        }

        // プランに応じた実行回数の制限
        let iterations = body.iterations || 1000;
        if (planType === 'free') iterations = Math.min(iterations, 100);
        else if (planType === 'pro') iterations = Math.min(iterations, 500);
        // Eliteは1000回（または制限なし）を許可

        const simulator = new MonteCarloDeckSimulator();
        const logs = simulator.simulate({ ...body, iterations });
        
        const firstLog = logs[0];
        const archetype = firstLog?.archetype || 'generic';
        const setupConfig = ArchetypePresetCatalog.get(archetype, body.perspective || 'first');

        const aggregator = new SimulationStatsAggregator();
        const summary = aggregator.aggregate(logs, archetype, setupConfig, body.perspective || 'first');


        const advisor = new DeckImprovementAdvisor();
        summary.suggestions = advisor.generateSuggestions(summary.failureBreakdown, logs);

        // 新アドバイスエンジンのセットアップと呼び出し
        if (planType !== 'free') {
            const adminSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
                process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            );
            registerAdviceSupabaseClient(() => adminSupabase as any);

            // SimulationSummaryの失敗集計を渡す
            const failRate = (type: string) => (summary.failureBreakdown.find(f => f.type === type)?.count || 0) / summary.totalTrials;

            const advancedAdvice = await generateDeckAdvice({
                deckCards: body.deck.map((c: any) => ({
                    cardId: c.id,
                    name: c.name,
                    count: c.count,
                    supertype: c.type as 'pokemon' | 'trainer' | 'energy',
                    subtype: c.kinds,
                    stage: c.kinds === 'basic' ? 'basic' : (c.kinds === 'stage1' ? 'stage1' : (c.kinds === 'stage2' ? 'stage2' : undefined)),
                    regulation: c.regulation,
                    roles: c.roles || []
                })),
                simulation: {
                    totalTrials: summary.totalTrials,
                    seedRate: summary.seedRate.rate,
                    setupSuccessRate: summary.setupRate.rate,
                    supportAccessRate: summary.supporterRate.rate,
                    energyAccessRate: summary.energyRate.rate,
                    noSeedStartRate: failRate('NO_BASIC') + failRate('LOW_BASIC_DENSITY'),
                    noSupportByTurn2Rate: failRate('NO_SUPPORTER'),
                    noEnergyByTurn2Rate: failRate('NO_ENERGY'),
                    noBench2ByTurn2Rate: failRate('NO_BENCH_SETUP'),
                    noAttackerReadyByTurn2Rate: failRate('NO_MAIN_ATTACKER'),
                    noEvolutionReadyByTurn2Rate: failRate('NO_EVOLUTION_LINE'),
                    brickedStartRate: failRate('HAND_BRICK'),
                },
                includeDebug: true
            });

            summary.advancedAdvice = advancedAdvice;
        }

        // プランに応じた情報制限
        if (planType === 'free') {
            summary.suggestions = []; // Free版は提案を隠す
            summary.failedBoardExamples = []; // 失敗例も非表示
        }

        const response: InitialSimulationResponse = {
            success: true,
            summary
        };

        return NextResponse.json(response);
    } catch (err: any) {
        console.error('[AI Simulation API Error]:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
