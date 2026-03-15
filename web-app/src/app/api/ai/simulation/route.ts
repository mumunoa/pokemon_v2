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

        // プラン情報の取得（PRO機能の制限用）
        let planTier: 'free' | 'pro' = 'free';
        if (userId) {
            // 本来はSupabaseから取得
            // planTier = await getUserPlan(userId);
        }

        const simulator = new MonteCarloDeckSimulator();
        const logs = simulator.simulate(body);
        
        const firstLog = logs[0];
        const archetype = firstLog.archetype;
        const setupConfig = ArchetypePresetCatalog.get(archetype, body.perspective || 'first');

        const aggregator = new SimulationStatsAggregator();
        const summary = aggregator.aggregate(logs, archetype, setupConfig, body.perspective || 'first');

        const advisor = new DeckImprovementAdvisor();
        summary.suggestions = advisor.generateSuggestions(summary.failureBreakdown, logs);

        // プランに応じた情報制限
        if (body.planTier !== 'pro') {
            summary.suggestions = []; // Free版は提案を隠す
            summary.failedBoardExamples = []; // 失敗例も隠す（または制限）
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
