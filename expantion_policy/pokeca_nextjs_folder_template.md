# Next.js ポケカツール フォルダ構成（実装テンプレ）

この構成は以下を前提としている

-   Next.js App Router
-   API Routes
-   AIシミュレーション連携
-   将来スケール可能

------------------------------------------------------------------------

# 全体構造

    /pokeca-tool
     ├ app
     ├ components
     ├ features
     ├ lib
     ├ server
     ├ db
     ├ ai
     └ types

------------------------------------------------------------------------

# app

Next.js App Router

    app
     ├ layout.tsx
     ├ page.tsx
     ├ deck
     ├ practice
     ├ analysis
     ├ meta
     └ profile

### deck

デッキ管理UI

    deck
     ├ page.tsx
     ├ DeckEditor.tsx
     └ DeckList.tsx

------------------------------------------------------------------------

### practice

一人回し

    practice
     ├ page.tsx
     ├ Board.tsx
     ├ Hand.tsx
     ├ Bench.tsx
     └ Deck.tsx

------------------------------------------------------------------------

### analysis

AIコーチ

    analysis
     ├ page.tsx
     ├ AIRecommendation.tsx
     └ WinRateChart.tsx

------------------------------------------------------------------------

### meta

環境分析

    meta
     ├ page.tsx
     ├ MetaRanking.tsx
     └ DeckStats.tsx

------------------------------------------------------------------------

# components

共通UI

    components
     ├ Card.tsx
     ├ CardList.tsx
     ├ Modal.tsx
     ├ Button.tsx
     └ Chart.tsx

------------------------------------------------------------------------

# features

ドメイン単位ロジック

    features
     ├ deck
     ├ practice
     ├ analysis
     └ meta

例

    features/deck
     ├ deckService.ts
     ├ deckRepository.ts
     └ deckHooks.ts

------------------------------------------------------------------------

# server

APIロジック

    server
     ├ api
     ├ services
     └ controllers

    server/api
     ├ deck
     ├ simulate
     ├ analysis
     └ meta

------------------------------------------------------------------------

# db

DB関連

    db
     ├ schema.ts
     ├ client.ts
     └ migrations

------------------------------------------------------------------------

# ai

AI処理

    ai
     ├ simulator
     ├ montecarlo
     ├ training
     └ recommendation

例

    ai/montecarlo
     ├ simulateGame.ts
     └ calculateWinRate.ts

------------------------------------------------------------------------

# lib

共通ロジック

    lib
     ├ auth.ts
     ├ stripe.ts
     └ utils.ts

------------------------------------------------------------------------

# types

型定義

    types
     ├ card.ts
     ├ game.ts
     ├ deck.ts
     └ ai.ts

------------------------------------------------------------------------

# API例

    /api/deck/create
    /api/deck/list
    /api/game/start
    /api/game/action
    /api/analysis/run

------------------------------------------------------------------------

# 推奨技術

Frontend

-   Next.js
-   React
-   Tailwind

Backend

-   Next.js API Routes
-   PostgreSQL
-   Prisma

AI

-   Python
-   PyTorch
