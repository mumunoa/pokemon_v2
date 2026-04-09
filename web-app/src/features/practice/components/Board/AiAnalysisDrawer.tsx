'use client';

import React from 'react';
import { AiAnalysisDrawerOld } from './AiAnalysisDrawerOld';
import { AiAnalysisDrawerNew } from './AiAnalysisDrawerNew';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ==========================================
// ★ UI 切り替えトグル ★
// true  : 最新のプロコーチUI（カード形式）
// false : 従来の旧UI
// 万が一新しいUIの表示がおかしい場合は、ここを false に変えるだけで戻ります。
// ==========================================
export const USE_NEW_PRO_UI = true;

export const AiAnalysisDrawer: React.FC<Props> = (props) => {
  if (USE_NEW_PRO_UI) {
    return <AiAnalysisDrawerNew {...props} />;
  }

  // フォールバック: 今までのUI
  return <AiAnalysisDrawerOld {...props} />;
};
