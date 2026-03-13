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

        // Fetch user plan
        const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('plan_type, ai_tickets')
            .eq('id', userId)
            .single();

        if (userError || !userProfile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        const isPro = userProfile.plan_type === 'pro' || userProfile.plan_type === 'elite';

        if (!isPro && userProfile.ai_tickets <= 0) {
            return NextResponse.json({ 
                error: 'Ticket limit reached',
                errorType: 'TICKETS_EMPTY',
                message: 'チケットが不足しています。Proプランへアップグレードしてください。'
            }, { status: 403 });
        }

        const body = await req.json();
        const { candidates, activePokemon, handCount, benchCount, isEliteAnalysis } = body;

        // Cost Optimization: We only send the top 3 candidates and minimal board state to Claude, 
        // relying on the frontend's local TS logic for the heavy lifting of move generation.
        const prompt = `あなたはポケカ（ポケモンカード）の世界大会プロプレイヤー兼コーチです。
現在プレイヤーは以下の候補手（AIによる一次選別）を持っています。
盤面状況: バトル場: ${activePokemon || 'なし'}, 手札枚数: ${handCount}, ベンチポケモン数: ${benchCount}
候補手トップ3:
${candidates.slice(0, 3).map((c: any, i: number) => `${i+1}. アクション: ${c.actionType}, 対象: ${c.sourceName || c.sourceId} ${c.targetName ? `→ ${c.targetName}` : ''}`).join('\n')}

コーチとして、それぞれの候補手が「なぜ良いのか」の深い戦略的解説と、相手のデッキタイプを想定した次ターンのリスク（裏目）を1つ、自然な日本語で200文字以内で簡潔に回答してください。`;

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
                model: isEliteAnalysis && userProfile.plan_type === 'elite' ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022',
                max_tokens: 300,
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
        const analysisText = claudeData.content[0].text;

        // Deduct ticket if free user
        if (!isPro && userProfile.ai_tickets > 0) {
            await supabase
                .from('users')
                .update({ ai_tickets: userProfile.ai_tickets - 1 })
                .eq('id', userId);
        }

        return NextResponse.json({ analysis: analysisText });

    } catch (error: any) {
        console.error('Pro Coach API Error:', error);
        return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
    }
}
