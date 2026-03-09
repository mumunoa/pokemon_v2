# ポケカ一人回しツール 画像表示の最終提案 + Next.js用アーキテクチャ設計書

## 1. 結論

ポケカ一人回しツールで**画像をできるだけ見せつつ、リスクを最小化する**最適構成は次です。

### 最終提案

- **基本UIは自作カード表示**
- **詳細表示時のみ画像を出す**
- **上級者向けにローカル画像読み込みを提供する**
- **サーバーでは画像を保存・配信しない**
- **課金価値は画像ではなく AI分析・保存・比較機能に置く**

この構成が、UX・実装性・継続運営性のバランスが最も良いです。

---

# 2. なぜこの構成が最適か

画像表示の設計では、次の3つが重要です。

1. **一人回し時の視認性**
2. **権利リスクの抑制**
3. **運営継続できる課金設計**

全面的に画像へ依存すると、

- サービス価値の中心が画像に見えやすい
- サーバー保存や再配信構造になりやすい
- 継続的な運営リスクが上がりやすい

一方で、画像を完全に捨てるとUXが弱くなります。

したがって、最適解は次です。

```text
通常表示 = 自作カードUI
必要時のみ = 画像表示
上級者向け = ローカル画像対応
```

---

# 3. 最終UX方針

## 3.1 通常の盤面表示

通常時は画像を前面に出さず、**自作カードUI**で表示します。

表示要素

- カード名
- HP
- タイプ
- 進化段階
- 付与エネルギー
- ダメージ
- 状態異常
- 主要タグ（たね / ex など）

イメージ

```text
┌──────────────┐
│ Pikachu ex   │
│ HP 220       │
│ 雷 / たね    │
│ エネ: ⚡⚡     │
│ ダメ: 30      │
└──────────────┘
```

これにより、**画像がなくても一人回しが成立**します。

## 3.2 詳細確認時のみ画像表示

カードをタップまたは長押しした時のみ、詳細モーダルを開きます。

```text
通常盤面
  ↓
カードタップ
  ↓
詳細モーダル
  ↓
画像 + 詳細情報
```

イメージ

```text
┌────────────────────┐
│      [画像]         │
│ Pikachu ex         │
│ HP 220             │
│ ワザ / 特性 / 補足   │
└────────────────────┘
```

これにより、**視認性を上げつつ、画像を補助的な位置にできる**のが強みです。

## 3.3 上級者向けローカル画像対応

ユーザーが自分の端末内画像を読み込める設定を用意します。

```text
設定画面
  ↓
画像フォルダ読み込み
  ↓
cardId と ローカル画像をマッピング
  ↓
盤面や詳細画面で使用
```

重要な前提は次です。

- サーバーへ画像アップロードしない
- サーバーで画像配信しない
- ブラウザ内に閉じる

---

# 4. 採用する表示モード

表示モードは3種類用意するとUXが強くなります。

## 4.1 Text Mode
最も軽い表示。

```text
カード名 / HP / タイプ / エネ / ダメージ
```

用途

- 初期表示
- 低スペック端末
- AI分析画面

## 4.2 Compact Mode
小さなサムネイル風の表示。

```text
[小さめビジュアル]
Pikachu ex
HP 220
```

用途

- 通常の一人回し
- スマホ向け表示

## 4.3 Local Image Mode
ローカル画像がある場合のみ使う高リッチ表示。

用途

- コアユーザー
- 長時間利用
- 視認性重視

---

# 5. 推奨プロダクト構成

## 標準
- Compact / Text を標準
- 詳細時のみ画像モーダル

## オプション
- ローカル画像読み込み
- 表示モード切り替え

## 課金
- AI分析
- 盤面保存
- 比較分析
- プレイレビュー
- 保存枠拡張

つまり

```text
画像 = UX向上
課金 = 分析価値
```

この分離が重要です。

---

# 6. Next.js用アーキテクチャ全体像

```text
Next.js App
 ├ UI Layer
 │   ├ Board
 │   ├ Hand
 │   ├ BattleCard
 │   ├ CardFocusModal
 │   └ Settings
 │
 ├ State Layer
 │   ├ gameStore
 │   ├ imageStore
 │   └ uiStore
 │
 ├ Image Layer
 │   ├ imageRegistry
 │   ├ localImageResolver
 │   └ imagePersistence
 │
 └ Engine Layer
     ├ gameEngine
     ├ logManager
     └ aiExport
```

---

# 7. 推奨フォルダ構成

```text
app/
  solo/
    page.tsx
  settings/
    images/
      page.tsx

components/
  board/
    Board.tsx
    BattleCard.tsx
    HandRow.tsx
    BenchRow.tsx
  card/
    CardMetaOverlay.tsx
    CardFocusModal.tsx
    CardThumb.tsx
  settings/
    ImageImportPanel.tsx
    DisplayModeSelector.tsx

stores/
  gameStore.ts
  imageStore.ts
  uiStore.ts

lib/
  image/
    imageRegistry.ts
    localImageResolver.ts
    indexedDbStorage.ts
  game-engine/
    core/
    history/
    log/
    serialization/
  cards/
    cardCatalog.ts

types/
  card.ts
  image.ts
  game.ts
  ui.ts
```

---

# 8. 主要コンポーネント設計

## 8.1 BattleCard.tsx

役割

- 盤面上のカード描画
- 表示モードに応じて見た目を切り替える
- タップで詳細モーダルを開く

責務

```text
表示モード判定
↓
画像があるか確認
↓
なければ自作UI
↓
クリックイベント送出
```

## 8.2 CardFocusModal.tsx

役割

- 詳細表示専用モーダル
- ローカル画像があれば表示
- なければカード詳細テキスト表示

表示優先順位

```text
1. ローカル画像
2. プレースホルダ
3. テキスト詳細
```

## 8.3 ImageImportPanel.tsx

役割

- ユーザー画像読み込み
- cardId と画像の関連付け
- 画像削除や再設定

サポート機能

- 個別選択
- 複数ファイル読み込み
- フォルダ読み込み（環境依存）

## 8.4 DisplayModeSelector.tsx

役割

- 表示モード切り替え

モード

- text
- compact
- local-image

---

# 9. 状態管理設計

## 9.1 uiStore

```ts
type DisplayMode = "text" | "compact" | "local-image"

type UIState = {
  displayMode: DisplayMode
  selectedCardId?: string
  isCardModalOpen: boolean
}
```

用途

- 表示モード切替
- モーダル開閉
- 選択カード管理

## 9.2 imageStore

```ts
type ImageMapping = {
  cardId: string
  localUrl: string
  fileName?: string
}

type ImageState = {
  mappings: Record<string, ImageMapping>
}
```

責務

- cardId とローカル画像URLの対応
- 読み込み
- 削除
- 永続化

## 9.3 gameStore

既存のゲーム状態管理をそのまま使い、表示とは分離します。

重要方針

```text
ゲーム状態と画像状態は分ける
```

理由

- ゲームエンジンを汚さない
- AI分析と表示ロジックを切り離せる
- テストしやすい

---

# 10. 画像解決ロジック

## 10.1 imageRegistry.ts

役割

```text
cardId から表示用画像URLを解決する
```

流れ

```text
cardId
↓
local mapping を確認
↓
見つかれば local URL
↓
なければ undefined
```

疑似コード

```ts
export function resolveCardImage(cardId: string, mappings: Record<string, ImageMapping>) {
  return mappings[cardId]?.localUrl
}
```

---

# 11. IndexedDBによる永続化

画像設定は `localStorage` より **IndexedDB** を推奨します。

理由

- 容量が大きい
- Blob / URLとの相性が良い
- ブラウザ内保存に向く

## 保存対象

- cardId
- fileName
- blob or object reference
- createdAt

注意

- ブラウザ差異を考慮
- 大量保存しすぎない
- 設定画面に削除導線を置く

---

# 12. 画面ごとの表示ルール

## 12.1 一人回し画面
標準は compact mode

- 盤面: compact
- 手札: compact
- 長押し / タップで詳細
- 詳細モーダルで画像

## 12.2 AI分析画面
基本は text mode

- 画像は最小限
- 分析対象カードだけ表示
- 情報密度を優先

## 12.3 設定画面
画像読み込み専用UI

- ローカル画像登録
- 表示モード切替
- データ削除

---

# 13. 実装ステップ

## Phase 1: 画像なしで自作UI完成

1. `BattleCard.tsx` を作る
2. `CardMetaOverlay.tsx` を作る
3. `Board.tsx` / `HandRow.tsx` に組み込む
4. text / compact で盤面が成立するようにする

### 完了条件
- 画像なしでも十分遊べる

## Phase 2: 詳細モーダル追加

5. `CardFocusModal.tsx` を作る
6. カードタップでモーダル表示
7. 詳細情報を表示
8. 画像未設定でも成立するようにする

### 完了条件
- 画像がなくても詳細確認可能

## Phase 3: ローカル画像読み込み

9. `ImageImportPanel.tsx` を作る
10. `imageStore.ts` を作る
11. `imageRegistry.ts` で解決処理追加
12. 詳細モーダルでローカル画像を表示

### 完了条件
- ユーザー画像を読み込んで詳細表示できる

## Phase 4: 表示モード切替

13. `DisplayModeSelector.tsx` を作る
14. text / compact / local-image を切り替える
15. `BattleCard.tsx` の表示分岐を完成させる

### 完了条件
- ユーザーが表示密度を選べる

## Phase 5: 永続化

16. IndexedDB 保存を追加
17. 次回起動時に画像設定復元
18. 削除・再読み込み導線を追加

### 完了条件
- 画像設定が継続利用できる

## Phase 6: 課金導線統合

19. 無料範囲は画像設定少数・基本表示
20. 有料で保存枠拡張や分析連携
21. 課金の中心はAI分析にする

### 完了条件
- 画像ではなく分析価値で課金できる

---

# 14. BattleCard の表示優先順位

BattleCard は次の順に描画します。

```text
表示モード = local-image
  ↓
ローカル画像がある
  ↓ yes → 画像表示
  ↓ no
compact 表示にフォールバック

表示モード = compact
  ↓
コンパクトUI表示

表示モード = text
  ↓
テキストUI表示
```

これにより、**画像がなくても破綻しない**UIになります。

---

# 15. 実装時の重要ルール

## 15.1 サーバーで画像を持たない
重要です。

- アップロードしない
- 保存しない
- CDN配信しない

## 15.2 ゲーム状態に画像情報を入れない
ゲームエンジンと表示層は分離します。

```text
gameState = 盤面
imageState = 表示補助
```

## 15.3 AI分析に画像を渡さない
AI分析にはカードID・状態・行動ログだけ渡します。

---

# 16. 最終的なおすすめ運用

## 無料
- 一人回し
- text / compact 表示
- 詳細モーダル
- 少数のローカル画像設定

## 有料
- AI分析
- 盤面保存
- 比較分析
- プレイレビュー
- 画像設定保存枠増加

つまり

```text
無料 = 遊べる
有料 = 強くなれる
```

この構造が最も強いです。

---

# 17. 最終結論

最もおすすめの構成は次です。

```text
標準:
  自作カードUI
  + 詳細時のみ画像

オプション:
  ローカル画像読み込み

課金:
  AI分析 / 保存 / 比較 / レビュー
```

この設計なら、

- 画像による見やすさを確保できる
- 画像がなくてもツールが成立する
- Next.js実装に落とし込みやすい
- ゲームエンジンやAI分析と自然に接続できる
- 継続運営しやすい

長期的に見ると、この構成が最も現実的で強いです。
