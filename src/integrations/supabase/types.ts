export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      apostas: {
        Row: {
          created_at: string
          id: string
          mercado_id: string
          mp_payment_id: string | null
          payout: number | null
          posicao_id: string | null
          preco_unitario: number
          quantidade: number
          status: string
          tipo: string
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          id?: string
          mercado_id: string
          mp_payment_id?: string | null
          payout?: number | null
          posicao_id?: string | null
          preco_unitario: number
          quantidade?: number
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor_total: number
        }
        Update: {
          created_at?: string
          id?: string
          mercado_id?: string
          mp_payment_id?: string | null
          payout?: number | null
          posicao_id?: string | null
          preco_unitario?: number
          quantidade?: number
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "apostas_posicao_id_fkey"
            columns: ["posicao_id"]
            isOneToOne: false
            referencedRelation: "posicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      carteiras: {
        Row: {
          created_at: string | null
          id: string
          saldo: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          saldo?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          saldo?: number | null
          user_id?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          created_at: string | null
          id: string
          mp_external_reference: string | null
          mp_payment_id: string | null
          posicao_id: string
          preco_pago: number
          quantidade: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mp_external_reference?: string | null
          mp_payment_id?: string | null
          posicao_id: string
          preco_pago: number
          quantidade: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mp_external_reference?: string | null
          mp_payment_id?: string | null
          posicao_id?: string
          preco_pago?: number
          quantidade?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_posicao_id_fkey"
            columns: ["posicao_id"]
            isOneToOne: false
            referencedRelation: "posicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          away_image_url: string | null
          away_logo: string | null
          category: string | null
          end_date: string | null
          event_date: string | null
          foto_capa: string | null
          home_logo: string | null
          id: string
          image_url: string | null
          nome: string | null
          start_date: string | null
          status: string | null
          subtitulo: string | null
          tipo_mercado: string | null
          volume: number | null
          volume_away: number | null
          volume_draw: number | null
          volume_home: number | null
          yes_prob: number | null
        }
        Insert: {
          away_image_url?: string | null
          away_logo?: string | null
          category?: string | null
          end_date?: string | null
          event_date?: string | null
          foto_capa?: string | null
          home_logo?: string | null
          id: string
          image_url?: string | null
          nome?: string | null
          start_date?: string | null
          status?: string | null
          subtitulo?: string | null
          tipo_mercado?: string | null
          volume?: number | null
          volume_away?: number | null
          volume_draw?: number | null
          volume_home?: number | null
          yes_prob?: number | null
        }
        Update: {
          away_image_url?: string | null
          away_logo?: string | null
          category?: string | null
          end_date?: string | null
          event_date?: string | null
          foto_capa?: string | null
          home_logo?: string | null
          id?: string
          image_url?: string | null
          nome?: string | null
          start_date?: string | null
          status?: string | null
          subtitulo?: string | null
          tipo_mercado?: string | null
          volume?: number | null
          volume_away?: number | null
          volume_draw?: number | null
          volume_home?: number | null
          yes_prob?: number | null
        }
        Relationships: []
      }
      opcoes_mercado: {
        Row: {
          created_at: string | null
          descricao: string | null
          foto_url: string | null
          id: string
          label: string
          market_id: string | null
          ordem: number | null
          probabilidade: number | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          foto_url?: string | null
          id?: string
          label: string
          market_id?: string | null
          ordem?: number | null
          probabilidade?: number | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          foto_url?: string | null
          id?: string
          label?: string
          market_id?: string | null
          ordem?: number | null
          probabilidade?: number | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opcoes_mercado_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount_brl: number | null
          created_at: string | null
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          plan_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount_brl?: number | null
          created_at?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          plan_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount_brl?: number | null
          created_at?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          plan_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_pendentes: {
        Row: {
          created_at: string | null
          id: string
          market_id: string | null
          plan_id: string | null
          posicao_id: string | null
          preference_id: string
          price_per_contract: number | null
          quantity: number | null
          status: string | null
          tipo: string | null
          total_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          market_id?: string | null
          plan_id?: string | null
          posicao_id?: string | null
          preference_id: string
          price_per_contract?: number | null
          quantity?: number | null
          status?: string | null
          tipo?: string | null
          total_cost: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          market_id?: string | null
          plan_id?: string | null
          posicao_id?: string | null
          preference_id?: string
          price_per_contract?: number | null
          quantity?: number | null
          status?: string | null
          tipo?: string | null
          total_cost?: number
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          features: Json | null
          id: string
          name: string
          predictions_limit: number
          price_brl: number
        }
        Insert: {
          features?: Json | null
          id: string
          name: string
          predictions_limit: number
          price_brl: number
        }
        Update: {
          features?: Json | null
          id?: string
          name?: string
          predictions_limit?: number
          price_brl?: number
        }
        Relationships: []
      }
      posicoes: {
        Row: {
          id: string
          mercado_id: string
          preco_unitario: number
          tipo: string
          volume_comprado: number
          volume_disponivel: number
          volume_total: number
        }
        Insert: {
          id?: string
          mercado_id: string
          preco_unitario?: number
          tipo: string
          volume_comprado?: number
          volume_disponivel?: number
          volume_total?: number
        }
        Update: {
          id?: string
          mercado_id?: string
          preco_unitario?: number
          tipo?: string
          volume_comprado?: number
          volume_disponivel?: number
          volume_total?: number
        }
        Relationships: []
      }
      prediction_usage: {
        Row: {
          count: number | null
          id: string
          month: string
          user_id: string
        }
        Insert: {
          count?: number | null
          id?: string
          month: string
          user_id: string
        }
        Update: {
          count?: number | null
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          id: string
          market_id: string
          minute: number
          prob_away: number | null
          prob_home: number | null
          recorded_at: string | null
          volume: number | null
        }
        Insert: {
          id?: string
          market_id: string
          minute: number
          prob_away?: number | null
          prob_home?: number | null
          recorded_at?: string | null
          volume?: number | null
        }
        Update: {
          id?: string
          market_id?: string
          minute?: number
          prob_away?: number | null
          prob_home?: number | null
          recorded_at?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      saques: {
        Row: {
          chave_pix: string
          created_at: string | null
          id: string
          observacao: string | null
          status: string | null
          tipo_chave: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          chave_pix: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          status?: string | null
          tipo_chave: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          chave_pix?: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          status?: string | null
          tipo_chave?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          plan_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string | null
          id: string
          mp_payment_id: string | null
          status: string | null
          tipo: string
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          mp_payment_id?: string | null
          status?: string | null
          tipo: string
          user_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          id?: string
          mp_payment_id?: string | null
          status?: string | null
          tipo?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string | null
          id: string
          saldo: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          saldo?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          saldo?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_resolver_mercados: { Args: never; Returns: undefined }
      creditar_saldo: {
        Args: { p_user_id: string; p_valor: number }
        Returns: undefined
      }
      debitar_saldo: {
        Args: { p_user_id: string; p_valor: number }
        Returns: undefined
      }
      increment_prediction_usage: { Args: { p_user_id: string }; Returns: Json }
      incrementar_volume_comprado: {
        Args: { p_posicao_id: string; p_quantidade: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
