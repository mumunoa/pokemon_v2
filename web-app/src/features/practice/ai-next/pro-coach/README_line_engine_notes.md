# recommendationEngine line評価対応版

含まれるもの:
- `types.ts`
- `generateActionLines.ts`
- `recommendationEngine.ts`

## 変更点
- `ProfessionalCoachResult` に `recommendedSequence` と `sequenceAlternatives` を追加
- `LegalAction` に `bench_pokemon` / `evolve` を前提とした line 生成対応
- 単発 `bestAction` に加えて「このターンの行動順序全体」を返す

## 方針
- `bestAction` は互換維持のため残す
- 新規UIでは `recommendedSequence.actions` と `recommendedSequence.transitionSummaries` を優先表示する

## DBスコープ
この版も全DBを読みません。
`CoachGameState.cards` に渡した deck-scoped の120枚分のみを使う前提です。
