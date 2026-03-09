# ポケカ一人回しツールのゲームエンジン設計（本格版）

## 1. 目的

このドキュメントは、**Next.js + TypeScript** で実装する
ポケカ一人回しツール向けの**本格的なゲームエンジン設計**をまとめたものです。

対象は以下です。

-   一人回し
-   盤面状態管理
-   行動ログ
-   Undo / Redo
-   AI分析用の状態保存
-   将来的なAIコーチ連携

この設計では、**完全なルール自動裁定**までは行わず、
**高速で気持ちよく回せるサンドボックス型エンジン**を前提にします。

------------------------------------------------------------------------

# 2. 設計方針

## 2.1 基本思想

このツールのゲームエンジンは、以下を優先します。

1.  **高速操作**
2.  **状態の一貫性**
3.  **Undo / Redo のしやすさ**
4.  **AI分析に使えるログの取得**
5.  **Next.jsフロントと相性の良い実装**

## 2.2 ルール設計の前提

本エンジンは次の思想を取ります。

-   厳密なルール自動判定は最小限
-   ユーザーが自由に盤面操作できる
-   行動はすべてログ化する
-   AI分析時はログと状態を使って評価する

つまり、**競技練習向けサンドボックス**です。

------------------------------------------------------------------------

# 3. 全体アーキテクチャ

``` text
UI (Next.js / React)
        │
        ▼
Input Layer
        │
        ▼
Command Layer
        │
        ▼
Game Engine
 ├ State Store
 ├ Reducer
 ├ Rule Helper
 ├ Log Manager
 └ History Manager
        │
        ▼
Persistence / AI Export
```

------------------------------------------------------------------------

# 4. コア構成

## 4.1 推奨モジュール

``` text
lib/
  game-engine/
    core/
      engine.ts
      reducer.ts
      state.ts
      actions.ts
      selectors.ts
    history/
      historyManager.ts
    log/
      logManager.ts
      logTypes.ts
    rules/
      validators.ts
      helpers.ts
    serialization/
      saveState.ts
      loadState.ts
      exportForAI.ts
```

------------------------------------------------------------------------

# 5. 状態モデル

## 5.1 GameState 全体像

``` ts
type GameState = {
  gameId: string
  turn: number
  phase: TurnPhase
  activePlayer: PlayerSide

  players: {
    self: PlayerState
    opponent: PlayerState
  }

  lastAction?: EngineAction
  createdAt: string
  updatedAt: string
}
```

## 5.2 PlayerState

``` ts
type PlayerState = {
  deck: CardInstance[]
  hand: CardInstance[]
  bench: CardInstance[]
  active?: CardInstance
  discard: CardInstance[]
  prize: CardInstance[]
  lostZone: CardInstance[]
  stadium?: CardInstance

  attachedEnergies: Record<string, AttachedEnergy[]>
  damageCounters: Record<string, number>
  statusConditions: Record<string, StatusCondition[]>

  supporterUsedThisTurn: boolean
  energyAttachedThisTurn: boolean
}
```

## 5.3 CardInstance

カードの原本データと盤面上のインスタンスは分けます。

``` ts
type CardInstance = {
  instanceId: string
  cardId: string
  name: string
  supertype: "pokemon" | "trainer" | "energy"
  subtype?: string
  hp?: number
  tags?: string[]
}
```

### なぜ instanceId が必要か

同じカードが複数枚あるため、盤面上では `cardId` だけでは区別できません。

例

-   ネストボール 4枚
-   基本雷エネルギー 8枚

このため、各カードに一意な `instanceId` を振ります。

------------------------------------------------------------------------

# 6. ターン管理

## 6.1 TurnPhase

``` ts
type TurnPhase =
  | "setup"
  | "turn_start"
  | "main"
  | "attack"
  | "turn_end"
```

## 6.2 ターン進行の考え方

``` text
setup
  ↓
turn_start
  ↓
main
  ↓
attack
  ↓
turn_end
  ↓
next turn
```

ただし、このツールはサンドボックスなので
**フェーズを厳密強制しすぎない**のがポイントです。

### 推奨

-   UI上は main を中心に操作
-   必要に応じて attack / end を切る
-   ルールチェックは補助程度

------------------------------------------------------------------------

# 7. 行動モデル

## 7.1 EngineAction

すべての操作を Action として定義します。

``` ts
type EngineAction =
  | { type: "DRAW_CARD"; player: PlayerSide; count: number }
  | { type: "PLAY_TO_BENCH"; player: PlayerSide; cardInstanceId: string }
  | { type: "SET_ACTIVE"; player: PlayerSide; cardInstanceId: string }
  | { type: "ATTACH_ENERGY"; player: PlayerSide; energyInstanceId: string; targetInstanceId: string }
  | { type: "EVOLVE_POKEMON"; player: PlayerSide; fromInstanceId: string; toInstanceId: string }
  | { type: "MOVE_CARD"; player: PlayerSide; from: Zone; to: Zone; cardInstanceId: string }
  | { type: "ADD_DAMAGE"; player: PlayerSide; targetInstanceId: string; amount: number }
  | { type: "HEAL_DAMAGE"; player: PlayerSide; targetInstanceId: string; amount: number }
  | { type: "APPLY_STATUS"; player: PlayerSide; targetInstanceId: string; status: StatusCondition }
  | { type: "REMOVE_STATUS"; player: PlayerSide; targetInstanceId: string; status: StatusCondition }
  | { type: "USE_SUPPORTER"; player: PlayerSide; cardInstanceId: string }
  | { type: "END_TURN"; player: PlayerSide }
```

## 7.2 なぜ Action ベースにするか

理由は3つです。

1.  Undo / Redo が簡単
2.  ログ収集しやすい
3.  AI分析でそのまま使える

------------------------------------------------------------------------

# 8. Reducer設計

ゲームエンジンの中心は reducer です。

``` ts
function gameReducer(state: GameState, action: EngineAction): GameState {
  switch (action.type) {
    case "DRAW_CARD":
      return handleDrawCard(state, action)
    case "PLAY_TO_BENCH":
      return handlePlayToBench(state, action)
    case "ATTACH_ENERGY":
      return handleAttachEnergy(state, action)
    case "ADD_DAMAGE":
      return handleAddDamage(state, action)
    case "END_TURN":
      return handleEndTurn(state, action)
    default:
      return state
  }
}
```

## 8.1 reducerの責務

-   状態更新
-   最低限の整合性維持
-   lastAction更新
-   updatedAt更新

## 8.2 reducerでやらないこと

-   UI表示ロジック
-   重いAI計算
-   課金判定
-   外部API通信

------------------------------------------------------------------------

# 9. History設計（Undo / Redo）

## 9.1 推奨方式

**Snapshot + Pointer** 方式を採用します。

``` ts
type HistoryState = {
  snapshots: GameState[]
  currentIndex: number
}
```

## 9.2 動作

``` text
state0 → state1 → state2 → state3
                    ↑
              currentIndex = 3
```

Undo

``` text
currentIndex = 2
```

Redo

``` text
currentIndex = 3
```

## 9.3 新しい操作をした場合

Undo後に新操作が入ったら、未来履歴は切り捨てます。

``` ts
snapshots = snapshots.slice(0, currentIndex + 1)
snapshots.push(newState)
currentIndex++
```

## 9.4 Snapshot方式を推す理由

Action replay方式よりもフロント実装が単純で、UIのバグを減らせます。

### MVP〜初期成長期では Snapshot 方式が最適

理由

-   実装が分かりやすい
-   デバッグしやすい
-   状態確認しやすい

------------------------------------------------------------------------

# 10. ログ設計

## 10.1 ログは2種類持つ

### A. ユーザー表示用ログ

``` ts
type DisplayLog = {
  id: string
  turn: number
  message: string
  timestamp: string
}
```

例

-   T1: ネストボールを使用
-   T1: ピカチュウをベンチに出した
-   T1: 雷エネルギーをつけた

### B. AI / 分析用構造化ログ

``` ts
type StructuredLog = {
  id: string
  gameId: string
  turn: number
  player: PlayerSide
  actionType: string
  payload: Record<string, unknown>
  stateHash?: string
  timestamp: string
}
```

## 10.2 なぜ分けるか

ユーザー向けログとAI向けログは目的が違うためです。

-   ユーザー向け：読みやすさ
-   AI向け：解析しやすさ

------------------------------------------------------------------------

# 11. Zone設計

## 11.1 Zone 型

``` ts
type Zone =
  | "deck"
  | "hand"
  | "active"
  | "bench"
  | "discard"
  | "prize"
  | "lostZone"
  | "stadium"
```

## 11.2 カード移動の原則

カードは常に**どこか1つのZoneにだけ存在する**ようにします。

これは非常に重要です。

------------------------------------------------------------------------

# 12. Selector設計

UIは state を直接読むより、selector経由で取得します。

``` ts
const getSelfHand = (state: GameState) => state.players.self.hand
const getSelfBench = (state: GameState) => state.players.self.bench
const getDamageOf = (state: GameState, instanceId: string) =>
  state.players.self.damageCounters[instanceId] ?? 0
```

### メリット

-   UIが軽くなる
-   将来の構造変更に強い
-   テストしやすい

------------------------------------------------------------------------

# 13. 最低限のルール補助

## 13.1 完全自動裁定はしない

ただし、最低限の補助は入れます。

### 例

-   ベンチ上限5枚
-   サポートは1ターン1回フラグ
-   エネルギー手貼り1ターン1回フラグ
-   ダメージがHP以上なら「きぜつ候補」を表示

## 13.2 validator 例

``` ts
type ValidationResult = {
  ok: boolean
  reason?: string
}
```

``` ts
function canAttachEnergy(state: GameState, player: PlayerSide): ValidationResult {
  const p = state.players[player]
  if (p.energyAttachedThisTurn) {
    return { ok: false, reason: "このターンはすでにエネルギーを付けています" }
  }
  return { ok: true }
}
```

------------------------------------------------------------------------

# 14. シリアライズ設計

## 14.1 保存対象

``` ts
type SavedGame = {
  state: GameState
  history: HistoryState
  logs: StructuredLog[]
}
```

## 14.2 用途

-   ローカル保存
-   サーバー保存
-   AI分析エクスポート
-   セーブポイント機能

------------------------------------------------------------------------

# 15. AI分析用エクスポート

## 15.1 exportForAI

AIには、重すぎるUI情報を渡さず、 必要な盤面情報のみを整形して渡します。

``` ts
type AIInput = {
  turn: number
  activePlayer: PlayerSide
  self: {
    handCount: number
    active?: string
    bench: string[]
    deckCount: number
    discardCount: number
  }
  opponent: {
    handCount?: number
    active?: string
    bench: string[]
  }
  recentActions: StructuredLog[]
}
```

## 15.2 重要

AI分析には**完全な描画情報ではなく、意味のある特徴量**を渡します。

------------------------------------------------------------------------

# 16. Next.js 実装構成

## 16.1 推奨フォルダ構成

``` text
app/
  solo/
    page.tsx

components/
  board/
    Board.tsx
    ActiveSlot.tsx
    BenchRow.tsx
    HandRow.tsx
  controls/
    ActionBar.tsx
    TurnControls.tsx
    DamageControls.tsx
  logs/
    DisplayLogPanel.tsx

lib/
  game-engine/
    core/
    history/
    log/
    rules/
    serialization/

stores/
  gameStore.ts
```

## 16.2 状態管理

推奨は **Zustand** です。

理由

-   軽い
-   局所更新しやすい
-   Next.js と相性が良い
-   ゲーム系UIで扱いやすい

------------------------------------------------------------------------

# 17. Zustand Store設計

``` ts
type GameStore = {
  state: GameState
  history: HistoryState
  displayLogs: DisplayLog[]
  structuredLogs: StructuredLog[]

  dispatch: (action: EngineAction) => void
  undo: () => void
  redo: () => void
  reset: () => void
  saveCheckpoint: () => void
}
```

## 17.1 dispatch の流れ

``` text
UI操作
  ↓
dispatch(action)
  ↓
reducer
  ↓
newState
  ↓
history push
  ↓
logs append
  ↓
UI再描画
```

------------------------------------------------------------------------

# 18. 実装ステップ（具体）

## Phase 1: エンジンの骨格

1.  `state.ts` を作る
2.  `actions.ts` を作る
3.  `reducer.ts` を作る
4.  `engine.ts` で dispatch をまとめる

### 完了条件

-   山札 / 手札 / ベンチ / バトル場の状態が一貫して動く

## Phase 2: UI連携

5.  Boardコンポーネントを state に接続
6.  HandRow / BenchRow / ActiveSlot を selector 経由で描画
7.  ActionBarから dispatch できるようにする

### 完了条件

-   UI操作で盤面が更新される

## Phase 3: Undo / Redo

8.  `historyManager.ts` を追加
9.  undo / redo ボタンを接続
10. 新操作時の未来履歴切り捨てを実装

### 完了条件

-   主要操作がすべて Undo / Redo 可能

## Phase 4: ログ

11. display log を追加
12. structured log を追加
13. turn / action / payload を保存

### 完了条件

-   人間にもAIにも使えるログが取れる

## Phase 5: AI入力整形

14. `exportForAI.ts` を作る
15. 現在盤面から AIInput を生成
16. 分析APIへ送る準備をする

### 完了条件

-   任意の盤面をAI分析に渡せる

## Phase 6: 保存・復元

17. ローカル保存
18. セーブポイント
19. JSONエクスポート

### 完了条件

-   後から盤面を再現できる

------------------------------------------------------------------------

# 19. 注意点

## 19.1 最初から完全ルールエンジンを作らない

これは非常に重要です。

最初から

-   効果解決
-   相手ターン割り込み
-   特殊裁定

まで入れると破綻しやすいです。

### 最初は

-   状態移動
-   ダメカン
-   エネルギー
-   進化
-   ログ

に集中した方が成功しやすいです。

## 19.2 UI都合で state を壊さない

UIドラッグ操作に合わせて状態を直接いじるのではなく、 必ず Action
経由で更新してください。

------------------------------------------------------------------------

# 20. サンプル実装イメージ

## 20.1 dispatch

``` ts
function dispatch(action: EngineAction) {
  const prev = get().state
  const next = gameReducer(prev, action)

  const displayLog = createDisplayLog(action, next)
  const structuredLog = createStructuredLog(action, next)

  set((store) => ({
    state: next,
    history: pushHistory(store.history, next),
    displayLogs: [...store.displayLogs, displayLog],
    structuredLogs: [...store.structuredLogs, structuredLog],
  }))
}
```

## 20.2 undo

``` ts
function undo() {
  set((store) => {
    const nextHistory = historyUndo(store.history)
    return {
      history: nextHistory,
      state: nextHistory.snapshots[nextHistory.currentIndex],
    }
  })
}
```

------------------------------------------------------------------------

# 21. 最終的に作れるもの

このゲームエンジン設計があれば、以下に発展できます。

-   高速一人回し
-   盤面保存
-   Undo / Redo
-   AI分析
-   プレイログ解析
-   AIコーチ
-   対戦ログDBへの送信

つまり、この設計は**一人回しツールの土台**であると同時に、
将来の**AIプロダクトの基盤**になります。

------------------------------------------------------------------------

# 22. 結論

最も重要なのは次の3点です。

1.  **Actionベースで状態を動かす**
2.  **Snapshot方式で Undo / Redo を実装する**
3.  **人間用ログとAI用ログを分離する**

この3つを最初から入れておくと、
後からAI分析や課金機能を足しても破綻しにくいです。

この設計をベースにすれば、Next.jsで作っている現状UIの上に
無理なく本格エンジンを組み込めます。
