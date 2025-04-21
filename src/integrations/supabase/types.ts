export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          code: string
          created_at: string | null
          current_nominator_id: string | null
          host_id: string
          id: string
          max_players: number
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_nominator_id?: string | null
          host_id: string
          id?: string
          max_players?: number
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_nominator_id?: string | null
          host_id?: string
          id?: string
          max_players?: number
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_current_nominator_id_fkey"
            columns: ["current_nominator_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      nominated_pokemon: {
        Row: {
          auction_status: string
          created_at: string | null
          current_bidder_id: string | null
          current_price: number
          current_turn_player_id: string | null
          game_id: string | null
          id: string
          last_bid_at: string | null
          pokemon_id: number
          pokemon_image: string
          pokemon_name: string
          status: string
          time_per_turn: number
          updated_at: string | null
        }
        Insert: {
          auction_status?: string
          created_at?: string | null
          current_bidder_id?: string | null
          current_price?: number
          current_turn_player_id?: string | null
          game_id?: string | null
          id?: string
          last_bid_at?: string | null
          pokemon_id: number
          pokemon_image: string
          pokemon_name: string
          status?: string
          time_per_turn?: number
          updated_at?: string | null
        }
        Update: {
          auction_status?: string
          created_at?: string | null
          current_bidder_id?: string | null
          current_price?: number
          current_turn_player_id?: string | null
          game_id?: string | null
          id?: string
          last_bid_at?: string | null
          pokemon_id?: number
          pokemon_image?: string
          pokemon_name?: string
          status?: string
          time_per_turn?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nominated_pokemon_current_turn_player_id_fkey"
            columns: ["current_turn_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominated_pokemon_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      player_balances: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          player_id: string | null
          updated_at: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          player_id?: string | null
          updated_at?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          player_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_balances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_collections: {
        Row: {
          acquired_at: string | null
          acquisition_price: number
          id: string
          player_id: string
          pokemon_id: number
          pokemon_image: string
          pokemon_name: string
        }
        Insert: {
          acquired_at?: string | null
          acquisition_price: number
          id?: string
          player_id: string
          pokemon_id: number
          pokemon_image: string
          pokemon_name: string
        }
        Update: {
          acquired_at?: string | null
          acquisition_price?: number
          id?: string
          player_id?: string
          pokemon_id?: number
          pokemon_image?: string
          pokemon_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_collections_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          game_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          game_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          game_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_balance: {
        Args: { player_id: string; amount: number }
        Returns: number
      }
      generate_game_code: {
        Args: Record<PropertyKey, never>
        Returns: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
