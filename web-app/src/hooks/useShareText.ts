'use client';

import { useMemo } from 'react';
import type { ShareScoreSummary } from '@/types/monetization';
import { createXShareTextVariants, pickBestShareText } from '@/lib/share/xShareText';

export function useShareText(summary: ShareScoreSummary | null) {
  return useMemo(() => {
    if (!summary) {
      return {
        best: null,
        variants: [],
      };
    }

    return {
      best: pickBestShareText(summary),
      variants: createXShareTextVariants(summary),
    };
  }, [summary]);
}
