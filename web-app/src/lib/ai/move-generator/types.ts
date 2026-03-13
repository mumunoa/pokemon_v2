import { AIInput, CandidateMove } from '@/types/ai';

/**
 * 候補手生成の各ジェネレータが共有するコンテキスト
 */
export interface MoveGeneratorContext {
    input: AIInput;
    // 将来的にカード定義データベースなどが必要な場合はここに追加
}

/**
 * 候補手生成ジェネレータの関数型
 */
export type MoveGenerator = (context: MoveGeneratorContext) => CandidateMove[];
