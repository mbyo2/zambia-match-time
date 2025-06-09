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
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          match_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          match_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_limits: {
        Row: {
          boosts_used: number | null
          created_at: string | null
          date: string | null
          id: string
          super_likes_used: number | null
          swipes_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          boosts_used?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          super_likes_used?: number | null
          swipes_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          boosts_used?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          super_likes_used?: number | null
          swipes_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          media_url: string | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          related_match_id: string | null
          related_user_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          related_match_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          related_match_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_match_id_fkey"
            columns: ["related_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          order_index: number | null
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          order_index?: number | null
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          order_index?: number | null
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_videos: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          id: string
          thumbnail_url: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          thumbnail_url?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          thumbnail_url?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string | null
          id: string
          view_type: string | null
          viewed_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          view_type?: string | null
          viewed_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          view_type?: string | null
          viewed_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_viewed_id_fkey"
            columns: ["viewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_max: number | null
          age_min: number | null
          bio: string | null
          created_at: string | null
          date_of_birth: string
          education: Database["public"]["Enums"]["education_level"] | null
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height_cm: number | null
          id: string
          interested_in: Database["public"]["Enums"]["gender_type"][]
          interests: string[] | null
          is_active: boolean | null
          is_verified: boolean | null
          last_active: string | null
          last_name: string | null
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          location_state: string | null
          max_distance: number | null
          occupation: string | null
          relationship_goals:
            | Database["public"]["Enums"]["relationship_goal"][]
            | null
          search_preferences: Json | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          created_at?: string | null
          date_of_birth: string
          education?: Database["public"]["Enums"]["education_level"] | null
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height_cm?: number | null
          id: string
          interested_in?: Database["public"]["Enums"]["gender_type"][]
          interests?: string[] | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_active?: string | null
          last_name?: string | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_state?: string | null
          max_distance?: number | null
          occupation?: string | null
          relationship_goals?:
            | Database["public"]["Enums"]["relationship_goal"][]
            | null
          search_preferences?: Json | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string
          education?: Database["public"]["Enums"]["education_level"] | null
          email?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          height_cm?: number | null
          id?: string
          interested_in?: Database["public"]["Enums"]["gender_type"][]
          interests?: string[] | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_active?: string | null
          last_name?: string | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_state?: string | null
          max_distance?: number | null
          occupation?: string | null
          relationship_goals?:
            | Database["public"]["Enums"]["relationship_goal"][]
            | null
          search_preferences?: Json | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          search_criteria: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          search_criteria: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          search_criteria?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          action: Database["public"]["Enums"]["swipe_action"]
          created_at: string | null
          id: string
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["swipe_action"]
          created_at?: string | null
          id?: string
          swiped_id: string
          swiper_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["swipe_action"]
          created_at?: string | null
          id?: string
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string | null
          id: string
          reviewed_at: string | null
          selfie_url: string
          status: Database["public"]["Enums"]["verification_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          selfie_url: string
          status?: Database["public"]["Enums"]["verification_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          selfie_url?: string
          status?: Database["public"]["Enums"]["verification_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      check_daily_swipe_limit: {
        Args: { user_uuid: string }
        Returns: number
      }
      create_notification: {
        Args: {
          target_user_id: string
          notification_type: string
          notification_title: string
          notification_message: string
          related_user_id?: string
          related_match_id?: string
        }
        Returns: string
      }
      get_compatible_profiles: {
        Args: {
          user_uuid: string
          max_distance?: number
          age_min?: number
          age_max?: number
          filter_education_levels?: string[]
          filter_interests?: string[]
          filter_relationship_goals?: string[]
          height_min?: number
          height_max?: number
        }
        Returns: {
          id: string
          first_name: string
          bio: string
          occupation: string
          education: string
          location_city: string
          location_state: string
          date_of_birth: string
          height_cm: number
          interests: string[]
          relationship_goals: string[]
          distance_km: number
          compatibility_score: number
        }[]
      }
      get_user_subscription_tier: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      increment_swipe_count: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      mark_notifications_read: {
        Args: { notification_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      education_level:
        | "high_school"
        | "some_college"
        | "bachelors"
        | "masters"
        | "phd"
        | "trade_school"
        | "other"
      gender_type:
        | "male"
        | "female"
        | "non_binary"
        | "other"
        | "prefer_not_to_say"
      message_type: "text" | "image" | "voice" | "video"
      relationship_goal: "casual" | "serious" | "friendship" | "networking"
      subscription_tier: "free" | "basic" | "premium" | "elite"
      swipe_action: "like" | "pass" | "super_like"
      verification_status: "pending" | "verified" | "rejected"
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
    Enums: {
      education_level: [
        "high_school",
        "some_college",
        "bachelors",
        "masters",
        "phd",
        "trade_school",
        "other",
      ],
      gender_type: [
        "male",
        "female",
        "non_binary",
        "other",
        "prefer_not_to_say",
      ],
      message_type: ["text", "image", "voice", "video"],
      relationship_goal: ["casual", "serious", "friendship", "networking"],
      subscription_tier: ["free", "basic", "premium", "elite"],
      swipe_action: ["like", "pass", "super_like"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
