import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateCoachSystemPrompt } from '@/lib/ai/promptGenerator';

export async function POST(req: Request) {
    try {
        const { prompt, boardState, turnCount, userId, gameId } = await req.json();

        const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

        if (!apiKey) {
            console.error('AI Coach Error: ANTHROPIC_API_KEY is missing or empty.');
            return NextResponse.json({ error: 'APIキーが見つかりません。.env.localを再確認してください。' }, { status: 500 });
        }

        console.log(`AI Coach: API Key prefix is [${apiKey.substring(0, 10)}] (length: ${apiKey.length})`);
        console.log(`AI Coach: Prompt length: ${prompt?.length || 0} characters`);

        const anthropic = new Anthropic({ apiKey });

        // Workbenchで成功が確認されたモデル名を使用
        console.log('AI Coach: Sending request to Anthropic (model: claude-sonnet-4-6)...');

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: generateCoachSystemPrompt(),
            messages: [
                { role: "user", content: prompt }
            ],
        });

        console.log('AI Coach: Success! Received message ID:', message.id);

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        // --- データ蓄積処理 (Supabaseへの保存) ---
        try {
            const { createSupabaseClient } = await import('@/lib/supabase');
            const supabase = createSupabaseClient();

            if (supabase) {
                // AIの回答から数値を簡易抽出 (正規表現)
                const accidentMatch = responseText.match(/事故率[:：]\s*(\d+)%/);
                const setupMatch = responseText.match(/理想展開率[:：]\s*(\d+)%/);

                const accidentRate = accidentMatch ? parseInt(accidentMatch[1], 10) : null;
                const setupRate = setupMatch ? parseInt(setupMatch[1], 10) : null;

                // データベースへ保存
                const { error: dbError } = await supabase
                    .from('ai_analysis_logs')
                    .insert([{
                        user_id: userId || 'anonymous',
                        game_id: gameId || null,
                        turn_count: turnCount || 0,
                        board_state: boardState || {},
                        prompt_text: prompt,
                        response_text: responseText,
                        accident_rate: accidentRate,
                        setup_rate: setupRate,
                        model_name: "claude-sonnet-4-6"
                    }]);

                if (dbError) console.error('AI Coach Sync Error:', dbError);
                else console.log('AI Coach: Analysis log saved to database.');
            }
        } catch (dbErr) {
            console.error('AI Coach Logging Failed (Non-critical):', dbErr);
        }
        // ------------------------------------

        return NextResponse.json({
            analysis: responseText,
        });

    } catch (error: any) {
        // 詳細なエラーをサーバーログに出力
        console.error('--- AI Coach API Error Detailed ---');
        console.error('Message:', error.message);
        if (error.status) console.error('Status:', error.status);
        if (error.error) console.error('Error Body:', error.error);
        console.error('-----------------------------------');

        return NextResponse.json(
            { error: 'AI分析中にエラーが発生しました。', details: error.message },
            { status: 500 }
        );
    }
}
