
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "letters": {
                  Row: {
                    "body": string | null,"deliver_at": string,"delivery_channel": Database["public"]['Enums']["channel"],"id": string,"image_paths": (string)[],"kind": Database["public"]['Enums']["letter_kind"],"pairing_id": string,"read_at": string | null,"sender_id": string,"sent_at": string
                  }
                  Insert: {
                    "body"?: string | null,"deliver_at"?: string,"delivery_channel": Database["public"]['Enums']["channel"],"id"?: string,"image_paths"?: (string)[],"kind": Database["public"]['Enums']["letter_kind"],"pairing_id": string,"read_at"?: string | null,"sender_id": string,"sent_at"?: string
                  }
                  Update: {
                    "body"?: string | null,"deliver_at"?: string,"delivery_channel"?: Database["public"]['Enums']["channel"],"id"?: string,"image_paths"?: (string)[],"kind"?: Database["public"]['Enums']["letter_kind"],"pairing_id"?: string,"read_at"?: string | null,"sender_id"?: string,"sent_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "letters_pairing_id_fkey"
      columns: ["pairing_id"]
isOneToOne: false
      referencedRelation: "pairings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "letters_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"pairings": {
                  Row: {
                    "created_at": string,"id": string,"pal_kod": string,"status": Database["public"]['Enums']["pairing_status"],"user_a_id": string,"user_b_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"pal_kod": string,"status"?: Database["public"]['Enums']["pairing_status"],"user_a_id": string,"user_b_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"pal_kod"?: string,"status"?: Database["public"]['Enums']["pairing_status"],"user_a_id"?: string,"user_b_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pairings_user_a_id_fkey"
      columns: ["user_a_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pairings_user_b_id_fkey"
      columns: ["user_b_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"points": {
                  Row: {
                    "address": string,"can_collect": boolean,"can_send": boolean,"hours": NonNullable<Json>,"id": string,"lat": number,"lng": number,"name": string,"phone": string | null,"pickup_note": string | null,"type": Database["public"]['Enums']["point_type"]
                  }
                  Insert: {
                    "address": string,"can_collect"?: boolean,"can_send"?: boolean,"hours": NonNullable<Json>,"id"?: string,"lat": number,"lng": number,"name": string,"phone"?: string | null,"pickup_note"?: string | null,"type": Database["public"]['Enums']["point_type"]
                  }
                  Update: {
                    "address"?: string,"can_collect"?: boolean,"can_send"?: boolean,"hours"?: NonNullable<Json>,"id"?: string,"lat"?: number,"lng"?: number,"name"?: string,"phone"?: string | null,"pickup_note"?: string | null,"type"?: Database["public"]['Enums']["point_type"]
                  }
                  Relationships: [
                    
                  ]
                },"private_profiles": {
                  Row: {
                    "city": string | null,"id": string,"postal_address": string | null
                  }
                  Insert: {
                    "city"?: string | null,"id": string,"postal_address"?: string | null
                  }
                  Update: {
                    "city"?: string | null,"id"?: string,"postal_address"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "private_profiles_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "age_range": Database["public"]['Enums']["age_range"] | null,"bio": string,"channel": Database["public"]['Enums']["channel"] | null,"created_at": string,"email": string,"id": string,"interests": (string)[],"is_premium": boolean,"languages": (string)[],"name": string | null,"notify_delivered": boolean,"notify_new_letter": boolean
                  }
                  Insert: {
                    "age_range"?: Database["public"]['Enums']["age_range"] | null,"bio"?: string,"channel"?: Database["public"]['Enums']["channel"] | null,"created_at"?: string,"email": string,"id": string,"interests"?: (string)[],"is_premium"?: boolean,"languages"?: (string)[],"name"?: string | null,"notify_delivered"?: boolean,"notify_new_letter"?: boolean
                  }
                  Update: {
                    "age_range"?: Database["public"]['Enums']["age_range"] | null,"bio"?: string,"channel"?: Database["public"]['Enums']["channel"] | null,"created_at"?: string,"email"?: string,"id"?: string,"interests"?: (string)[],"is_premium"?: boolean,"languages"?: (string)[],"name"?: string | null,"notify_delivered"?: boolean,"notify_new_letter"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"id": string,"pairing_id": string,"reason": string,"reporter_id": string
                  }
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"pairing_id": string,"reason": string,"reporter_id": string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"pairing_id"?: string,"reason"?: string,"reporter_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_pairing_id_fkey"
      columns: ["pairing_id"]
isOneToOne: false
      referencedRelation: "pairings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "age_range": "18-25"|"26-40"|"41-60"|"60-75"|"75+","channel": "PAPER"|"APP","letter_kind": "TYPED"|"SCAN","pairing_status": "INVITED"|"ACTIVE"|"ENDED"|"BLOCKED","point_type": "PALPOINT"|"PALBOX"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "age_range": ["18-25", "26-40", "41-60", "60-75", "75+"],"channel": ["PAPER", "APP"],"letter_kind": ["TYPED", "SCAN"],"pairing_status": ["INVITED", "ACTIVE", "ENDED", "BLOCKED"],"point_type": ["PALPOINT", "PALBOX"]
          }
        }
} as const
