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

export async function POST(req: NextRequest) {
    try {
        const body: InitialSimulationRequest = await req.json();
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
