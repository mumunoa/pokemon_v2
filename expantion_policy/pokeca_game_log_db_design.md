# ポケカツール ゲームログDB完全設計（AI学習対応）

## 概要

このドキュメントはポケカツールにおける以下の機能を支えるDB設計を定義する。

-   AIコーチ
-   メタ分析
-   プレイ分析
-   デッキランキング
-   将来のAI学習

------------------------------------------------------------------------

# 全体構造

    Game
     ├ Turn
     │   ├ Action
     │   │   └ Result
     │   └ GameState
     └ Result

    User
     │
     └── Game
           │
           ├── Turn
           │     │
           │     ├── GameState
           │     └── Action
           │
           └── Result

------------------------------------------------------------------------

# データフロー

    プレイヤー操作
          │
    Action Event
          │
    GameState Snapshot
          │
    Database
          │
    Analytics / AI

------------------------------------------------------------------------

# 推奨DB

    PostgreSQL
    +
    JSONB

理由

-   ゲーム状態が可変
-   JSON保存が必要
-   高速検索可能

------------------------------------------------------------------------

# テーブル設計

## users

  column       type
  ------------ -----------
  id           uuid
  email        text
  created_at   timestamp

------------------------------------------------------------------------

## decks

  column    type
  --------- ------
  id        uuid
  user_id   uuid
  name      text

------------------------------------------------------------------------

## deck_cards

  column    type
  --------- ------
  deck_id   uuid
  card_id   text
  count     int

------------------------------------------------------------------------

# ゲームログ

## games

  column          type
  --------------- -----------
  id              uuid
  user_id         uuid
  deck_id         uuid
  opponent_type   text
  result          text
  created_at      timestamp

------------------------------------------------------------------------

## turns

  column        type
  ------------- ------
  id            uuid
  game_id       uuid
  turn_number   int

------------------------------------------------------------------------

## actions

  column        type
  ------------- -------
  id            uuid
  turn_id       uuid
  action_type   text
  card_id       text
  target        jsonb

action_type例

    play_card
    attack
    draw
    switch

------------------------------------------------------------------------

# GameState（最重要）

## game_states

  column       type
  ------------ -------
  id           uuid
  turn_id      uuid
  state_json   jsonb

例

``` json
{
 "active": "pikachu_ex",
 "bench": ["miraidon_ex"],
 "hand": ["nest_ball","energy"],
 "deck_remaining": 25
}
```

------------------------------------------------------------------------

# AI学習データ

    GameState
    +
    Action
    +
    Result

## training_samples

  column   type
  -------- -------
  state    jsonb
  action   text
  reward   float

------------------------------------------------------------------------

# Monte Carlo結果キャッシュ

## simulation_results

  column       type
  ------------ -------
  state_hash   text
  action       text
  win_rate     float

------------------------------------------------------------------------

# メタ分析

## deck_meta

  column       type
  ------------ -------
  deck_name    text
  usage_rate   float
  win_rate     float

------------------------------------------------------------------------

# データパイプライン

    Game Logs
         │
    ETL
         │
    Data Warehouse
         │
    Meta Analysis

------------------------------------------------------------------------

# AIコーチ学習フロー

    Users
     │
    Game Logs
     │
    Training Data
     │
    AI Model
     │
    Recommendations

------------------------------------------------------------------------

# パフォーマンス戦略

    Hot Storage
    PostgreSQL

    Cold Storage
    BigQuery / Data Warehouse

------------------------------------------------------------------------

# API設計

    /api/game/start
    /api/game/action
    /api/game/end

例

POST /api/game/action

``` json
{
 "gameId": "...",
 "action": "play_card",
 "card": "nest_ball"
}
```

------------------------------------------------------------------------

# このDBで可能な機能

-   AIコーチ
-   プレイ分析
-   メタ環境
-   デッキランキング
