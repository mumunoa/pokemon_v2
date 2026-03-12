import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateCoachSystemPrompt } from '@/lib/ai/promptGenerator';

export async function POST(req: Request) {
    try {
        const { prompt, boardState, turnCount, gameId, fingerprintId, localStorageId } = await req.json();

        // auth() を使って安全に実際のユーザーIDを取得
        const { auth } = await import('@clerk/nextjs/server');
        const { userId: clerkUserId } = await auth();
        const finalUserId = clerkUserId || 'anonymous';

        // IPアドレスの取得
        const forwardedFor = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || 'unknown');

        const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

        if (!apiKey) {
            console.error('AI Coach Error: ANTHROPIC_API_KEY is missing or empty.');
            return NextResponse.json({ error: 'APIキーが見つかりません。.env.localを再確認してください。' }, { status: 500 });
        }

        console.log(`AI Coach: API Key prefix is [${apiKey.substring(0, 10)}]`);
        console.log(`AI Coach Request: User=${finalUserId}, IP=${ipAddress}, FP=${fingerprintId}, LS=${localStorageId}`);

        // --- チケット関連の制限チェック ---
        let canProceed = true;
        let isPro = false;
        let userTickets = 0;

        const { createSupabaseClient } = await import('@/lib/supabase');
        // Webhook用のServiceRoleKeyをフォールバックとして使用することも検討できますが、
        // 読み取り（SELECT）はanonキーでもRLSポリシーで許可されていれば可能です。
        const supabase = createSupabaseClient();

        if (supabase) {
            // 1. ログインユーザー本人のチケット枚数・有料プランチェック
            if (clerkUserId) {
                const { data: userRecord, error: fetchError } = await supabase
                    .from('users')
                    .select('ai_tickets, pro_trial_until')
                    .eq('id', clerkUserId)
                    .single();

                if (!fetchError && userRecord) {
                    const now = new Date();
                    const trialUntil = userRecord.pro_trial_until ? new Date(userRecord.pro_trial_until) : null;
                    isPro = trialUntil !== null && trialUntil > now;
                    userTickets = userRecord.ai_tickets;

                    if (!isPro && userRecord.ai_tickets <= 0) {
                        return NextResponse.json(
                            { error: 'TICKETS_EMPTY', details: 'AI分析のチケットが不足しています。明日の回復をお待ちください。' },
                            { status: 403 }
                        );
                    }
                }
            }

            // 2. IP / Fingerprint / LocalStorage を用いた同一人物判定（サブ垢・シークレットブラウザ対策）
            // ※ 有料ユーザー(Pro) は無制限のためスキップ
            if (!isPro) {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                // どれか一つでも一致する過去24時間以内の利用履歴をカウント
                // 注: .or() にはカンマ区切りで条件を指定
                const conditions = [];
                if (ipAddress && ipAddress !== 'unknown') conditions.push(`ip_address.eq.${ipAddress}`);
                if (fingerprintId) conditions.push(`fingerprint_id.eq.${fingerprintId}`);
                if (localStorageId) conditions.push(`local_storage_id.eq.${localStorageId}`);

                if (conditions.length > 0) {
                    const orQuery = conditions.join(',');
                    const { count, error: countError } = await supabase
                        .from('ai_analysis_logs')
                        .select('*', { count: 'exact', head: true })
                        .gte('created_at', startOfDay.toISOString())
                        .or(orQuery);

                    if (!countError && count !== null) {
                        // 1日あたりの無料利用制限を3回とする（アカウントを新規作成してもここではじく）
                        if (count >= 3) {
                            console.warn(`Abuse Prevention Block: Device/IP rate limit exceeded (${count} usages). IP=${ipAddress}`);

                            // 同一端末・ネットワークでの制限に引っかかった場合、
                            // 現在ログイン中の量産アカウントのチケット枚数を直ちにDB上でも0にする
                            if (clerkUserId && userTickets > 0) {
                                await supabase
                                    .from('users')
                                    .update({ ai_tickets: 0 })
                                    .eq('id', clerkUserId);
                            }

                            return NextResponse.json(
                                { error: 'TICKETS_EMPTY', details: 'この端末またはネットワークからの本日の無料利用回数（3回）を超過しました。再度利用するには明日までお待ちください。' },
                                { status: 403 }
                            );
                        }
                    }
                }
            }
        }
        // -----------------------

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
                        user_id: finalUserId,
                        game_id: gameId || null,
                        turn_count: turnCount || 0,
                        board_state: boardState || {},
                        prompt_text: prompt,
                        response_text: responseText,
                        accident_rate: accidentRate,
                        setup_rate: setupRate,
                        model_name: "claude-sonnet-4-6",
                        ip_address: ipAddress,
                        fingerprint_id: fingerprintId,
                        local_storage_id: localStorageId
                    }]);

                if (dbError) console.error('AI Coach Sync Error:', dbError);
                else console.log('AI Coach: Analysis log saved to database.');

                // --- チケット消費 (Proでないユーザーのみ) ---
                if (clerkUserId && !isPro) {
                    // Fetch current tickets first and deduct 1
                    const { data: currentUser } = await supabase
                        .from('users')
                        .select('ai_tickets')
                        .eq('id', clerkUserId)
                        .single();

                    if (currentUser && currentUser.ai_tickets > 0) {
                        const { error: updateError } = await supabase
                            .from('users')
                            .update({ ai_tickets: currentUser.ai_tickets - 1 })
                            .eq('id', clerkUserId);

                        if (updateError) console.error('Error deducting ticket:', updateError);
                        else console.log(`AI Coach: Deducted 1 ticket for user ${clerkUserId}. Remaining: ${currentUser.ai_tickets - 1}`);
                    }
                }
                // ----------------------------------------
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
