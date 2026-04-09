# complete replacement with bench_pokemon / evolve

含まれるもの:
- types.ts
- legalAction.ts
- stateTransition.ts

## evolve 判定について
結論として、**card_type だけでは不十分** です。

必要なのは少なくとも以下です。
- `type` が pokemon であること
- `kinds` が `stage1` / `stage2` であること
- `evolves` に進化元名または進化先名の対応があること
- 盤面上にその進化元が存在すること
- そのポケモンが今ターン場に出たばかりではないこと
- そのポケモンが今ターンすでに進化していないこと

つまり、進化判定は
`card_type` + `kinds` + `evolves` + 盤面タイミング情報
の組み合わせで見る実装です。

## DBスコープ
この実装は全DBを読みません。
`CoachGameState.cards` に入っている deck-scoped の 120 枚分だけを参照します。
