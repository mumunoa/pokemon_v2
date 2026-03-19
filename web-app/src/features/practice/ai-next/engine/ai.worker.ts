/* eslint-disable no-restricted-globals */
import { buildRecommendationFromRoleComplete } from './recommendationEngine';

/**
 * AI Analysis WebWorker
 */
self.onmessage = (event) => {
  const { board, handCards, profiles, archetype } = event.data;
  
  try {
    const result = buildRecommendationFromRoleComplete({
      board,
      handCards,
      profiles,
      archetype
    });
    
    self.postMessage({ type: 'SUCCESS', result });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: String(error) });
  }
};

export {};
