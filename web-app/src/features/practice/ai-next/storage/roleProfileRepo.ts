
import { SupabaseClient } from '@supabase/supabase-js';
import { CardRoleProfile } from '../domain/types';

/**
 * Compatible with current card_role_profiles table:
 * - keeps onConflict: 'card_id'
 * - writes primitives / primitive_evidence after migration adds columns
 */

export class RoleProfileRepo {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  private toRow(profile: CardRoleProfile) {
    return {
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
      primitives: profile.primitives || [],
      primitive_evidence: profile.primitiveEvidence || [],
      capabilities: profile.capabilities || [],
      inferred_at: profile.inferredAt,
      version: profile.version,
    };
  }

  async upsert(profile: CardRoleProfile) {
    const { error } = await this.supabase
      .from('card_role_profiles')
      .upsert(this.toRow(profile), { onConflict: 'card_id, version' }); // Updated to match unique constraint in migration

    if (error) throw error;
  }

  async upsertMany(profiles: CardRoleProfile[]) {
    if (profiles.length === 0) return;

    const rows = profiles.map((profile) => this.toRow(profile));
    const { error } = await this.supabase
      .from('card_role_profiles')
      .upsert(rows, { onConflict: 'card_id, version' });

    if (error) throw error;
  }

  async findByCardIds(cardIds: string[]): Promise<CardRoleProfile[]> {
    if (cardIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('card_role_profiles')
      .select('*')
      .in('card_id', cardIds)
      .order('inferred_at', { ascending: false });

    if (error || !data) return [];

    // 重複を排除（同じ card_id があれば最新のもののみ採用）
    const uniqueMap = new Map<string, any>();
    for (const item of data) {
      if (!uniqueMap.has(item.card_id)) {
        uniqueMap.set(item.card_id, item);
      }
    }

    return Array.from(uniqueMap.values()).map(item => ({
      cardId: item.card_id,
      cardName: item.card_name,
      staticRoles: item.static_roles,
      deckRoles: item.deck_roles,
      dynamicRoles: item.dynamic_roles,
      keyScore: item.key_score,
      labels: item.labels,
      reasons: item.reasons,
      confidence: item.confidence,
      evidence: item.evidence,
      primitives: item.primitives,
      primitiveEvidence: item.primitive_evidence,
      capabilities: item.capabilities,
      inferredAt: item.inferred_at,
      version: item.version,
    }));
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
      primitives: data.primitives,
      primitiveEvidence: data.primitive_evidence,
      capabilities: data.capabilities,
      inferredAt: data.inferred_at,
      version: data.version,
    };
  }
}
