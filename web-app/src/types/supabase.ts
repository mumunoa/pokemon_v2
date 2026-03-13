export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          ai_tickets: number
          plan_type: 'free' | 'pro' | 'elite'
          pro_trial_until: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          id: string
          created_at?: string
          ai_tickets?: number
          plan_type?: 'free' | 'pro' | 'elite'
          pro_trial_until?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          ai_tickets?: number
          plan_type?: 'free' | 'pro' | 'elite'
          pro_trial_until?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
      }
      play_logs: {
        Row: {
          id: string
          user_id: string
          game_id: string
          logs: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          logs: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          logs?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
