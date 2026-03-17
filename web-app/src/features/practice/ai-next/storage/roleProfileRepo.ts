
import { SupabaseClient } from '@supabase/supabase-js';
import { CardRoleProfile } from '../domain/types';

/**
 * Repository for static card role profiles.
 */

export class RoleProfileRepo {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async upsert(profile: CardRoleProfile) {
    const { error } = await this.supabase
      .from('card_role_profiles')
      .upsert({
        card_id: profile.cardId,
        card_name: profile.cardName,
        static_roles: profile.staticRoles,
        deck_roles: profile.deckRoles || [],
        dynamic_roles: profile.dynamicRoles || [],
        key_score: profile.keyScore,
        labels: profile.labels,
        reasons: profile.reasons,
        confidence: profile.confidence,
        evidence: profile.evidence,
        inferred_at: profile.inferredAt,
        version: profile.version,
      }, { onConflict: 'card_id,version' });

    if (error) throw error;
  }

  async findByCardId(cardId: string, version: string = 'latest'): Promise<CardRoleProfile | null> {
    const query = this.supabase
      .from('card_role_profiles')
      .select('*')
      .eq('card_id', cardId);
      
    if (version !== 'latest') {
        query.eq('version', version);
    } else {
        query.order('inferred_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();
    if (error || !data) return null;

    return {
      cardId: data.card_id,
      cardName: data.card_name,
      staticRoles: data.static_roles,
      deckRoles: data.deck_roles,
      dynamicRoles: data.dynamic_roles,
      keyScore: data.key_score,
      labels: data.labels,
      reasons: data.reasons,
      confidence: data.confidence,
      evidence: data.evidence,
      inferredAt: data.inferred_at,
      version: data.version,
    };
  }
}
