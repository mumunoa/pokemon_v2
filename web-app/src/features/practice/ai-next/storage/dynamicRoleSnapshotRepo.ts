
import { SupabaseClient } from '@supabase/supabase-js';
import { DynamicRoleSnapshot } from '../domain/types';

/**
 * Repository for boardstate-dependent dynamic role snapshots.
 */

export class DynamicRoleSnapshotRepo {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async insert(snapshot: DynamicRoleSnapshot) {
    const { error } = await this.supabase
      .from('card_dynamic_role_snapshots')
      .insert({
        user_id: snapshot.userId,
        session_id: snapshot.sessionId,
        turn_number: snapshot.turnNumber,
        card_id: snapshot.cardId,
        card_name: snapshot.cardName,
        board_hash: snapshot.boardHash,
        dynamic_roles: snapshot.dynamicRoles,
        action_line: snapshot.actionLine,
        reasons: snapshot.reasons,
        score: snapshot.score,
        source_action_id: snapshot.sourceActionId,
        version: snapshot.version,
      });

    if (error) throw error;
  }

  async insertMany(snapshots: DynamicRoleSnapshot[]) {
    const { error } = await this.supabase
        .from('card_dynamic_role_snapshots')
        .insert(snapshots.map(s => ({
            user_id: s.userId,
            session_id: s.sessionId,
            turn_number: s.turnNumber,
            card_id: s.cardId,
            card_name: s.cardName,
            board_hash: s.boardHash,
            dynamic_roles: s.dynamicRoles,
            action_line: s.actionLine,
            reasons: s.reasons,
            score: s.score,
            source_action_id: s.sourceActionId,
            version: s.version,
        })));

    if (error) throw error;
  }
}
