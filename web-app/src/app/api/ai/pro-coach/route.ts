import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { createSupabaseClient } = await import('@/lib/supabase');
        const supabase = createSupabaseClient();
        if (!supabase) throw new Error('Supabase client error');

        const { checkAndResetTickets, deductTicket } = await import('@/lib/ai/ticketHelper');
        let ticketInfo;
        try {
            ticketInfo = await checkAndResetTickets(supabase, userId);
        } catch (e) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        const body = await req.json();
        const { features, candidates, plan_type: req_plan_type } = body;
        const { ai_tickets, isPro, plan_type: user_plan_type } = ticketInfo;
        const plan_type = req_plan_type || user_plan_type;

        if (!isPro && ai_tickets <= 0) {
            return NextResponse.json({ 
                error: 'Ticket limit reached',
                errorType: 'TICKETS_EMPTY',
                message: '本日の無料AI分析チケットを使い果たしました。明日の回復をお待ちいただくか、Proプランをご検討ください。'
            }, { status: 403 });
        }

        const prompt = `あなたはポケモンカード（ポケカ）の世界大会優勝経験を持つプロプレイヤー兼コーチです。
現在、背後で稼働している思考エンジン（Blueprint Engine）が、盤面から以下の戦術論理を導き出しました。
あなたはこれらの「計算済みの結論」をプロの眼で解釈し、ユーザーに納得感のある分析を提供してください。

### 【計算済みの戦術論理】:
- **現在のゴール (Goal)**: ${features.goal?.type} (${features.goal?.primaryReason})
- **選択されたサイドプラン (Prize Plan)**: [${features.prizePlan?.pattern.join(', ')}]
  - 完遂想定ターン: ${features.prizePlan?.estimatedTurnsToFinish}
  - 成功確率: ${features.probability?.twoTurnPlanRate}%
- **リスク評価 (Risk)**: 総合スコア ${features.risk?.totalRiskScore}/100
  - 手札崩壊リスク: ${features.risk?.handCollapseRisk}%
  - 返しでの負け筋: ${features.risk?.prizeRaceLossRisk}%
- **再現性 (Continuity)**: 次ターンの動き作り ${features.probability?.nextTurnContinuityRate}%

### 【現在の具体的盤面】:
- フェーズ: ${features.phase}
- 自サイド残り: ${features.ownPrizesRemaining}, 相手サイド残り: ${features.oppPrizesRemaining}
- 自分の場: バトル場=${features.oppActiveName || '不明'}, ベンチ=[${features.ownBenchNames.join(', ')}]
- 自分の手札: [${features.ownHandNames.join(', ')}]
- 相手の場: バトル場=${features.oppActiveName || '不明'}, ベンチ=[${features.oppBenchNames.join(', ')}]

### あなたの任務:
1. **エンジンの結論を解説せよ**: なぜ今このゴール（${features.goal?.type}）が選ばれたのか、プロの視点で肉付けしてください。
2. **2ターン先を語れ**: 今ターンの行動が、選ばれたサイドプラン [${features.prizePlan?.pattern.join(', ')}] にどう繋がるかを示してください。
3. **裏目の言語化**: リスクスコアに基づき、相手が持っているかもしれない「裏目の1枚（ボスの指令、特定エネ等）」を予測してください。
4. **順序の美学**: 提示された候補手の「順番」の重要性を説いてください（情報を先に増やす等）。

### 出力フォーマット (JSONのみ):
{
  "macroStrategy": { "activePlan": "${features.prizePlan?.id}", "estimatedTurnsToWin": ${features.prizePlan?.estimatedTurnsToFinish}, "opponentEstimatedTurnsToWin": ${features.oppPrizesRemaining}, "description": "TSエンジンが算出したプランに基づくプロの解説..." },
  "opponentThreat": { "expectedMaxDamage": 180, "requiredCards": 2, "lethalThreat": ${features.risk?.prizeRaceLossRisk > 70}, "disruptValue": 10, "probableHiddenCards": ["...", "..."] },
  "keyCards": [ { "cardName": "...", "score": 95, "reason": "..." } ],
  "analysis": "思考エンジンの結論に基づいた、プロによる総合解説文...",
  "simulationInsight": { "headline": "...", "metrics": [...], "suggestions": [...] }
}
`;

        if (!anthropicApiKey) {
             console.error('ANTHROPIC_API_KEY is not set');
             return NextResponse.json({ error: 'AI Service Unavailable' }, { status: 503 });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: plan_type === 'elite' ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022',
                max_tokens: 1000,
                system: "あなたはポケカのプロコーチです。必ず指定されたJSONフォーマットのみで回答してください。解説は自然な日本語で行ってください。",
                messages: [
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Anthropic API error:', errorData);
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const claudeData = await response.json();
        const contentText = claudeData.content[0].text;
        
        try {
            const analysisJson = JSON.parse(contentText);
            // Deduct ticket if free user
            if (!isPro) {
                await deductTicket(supabase, userId, ai_tickets);
            }
            return NextResponse.json(analysisJson);
        } catch (parseError) {
            console.error('Failed to parse AI JSON:', contentText);
            return NextResponse.json({ 
                error: 'AI Analysis Parse Error', 
                analysis: contentText // フォールバックとしてテキストをそのまま返す
            }, { status: 200 });
        }

    } catch (error: any) {
        console.error('Pro Coach API Error:', error);
        return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
    }
}
