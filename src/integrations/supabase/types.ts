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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accommodations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          location_city: string | null
          location_country: string | null
          name: string
          owner_id: string
          price_per_night: number
          type: Database["public"]["Enums"]["accommodation_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_city?: string | null
          location_country?: string | null
          name: string
          owner_id: string
          price_per_night: number
          type: Database["public"]["Enums"]["accommodation_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_city?: string | null
          location_country?: string | null
          name?: string
          owner_id?: string
          price_per_night?: number
          type?: Database["public"]["Enums"]["accommodation_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          points_reward: number | null
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          points_reward?: number | null
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          points_reward?: number | null
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      boosts: {
        Row: {
          boost_type: string
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          boost_type: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          boost_type?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      daily_rewards: {
        Row: {
          claimed: boolean | null
          created_at: string | null
          id: string
          reward_date: string | null
          reward_type: string
          reward_value: number | null
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          reward_date?: string | null
          reward_type: string
          reward_value?: number | null
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          reward_date?: string | null
          reward_type?: string
          reward_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_transactions: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          gift_id: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          gift_id: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          gift_id?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "virtual_gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      icebreaker_prompts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          prompt_text: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_text: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_text?: string
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
          body_type: string | null
          compatibility_score: number | null
          created_at: string | null
          date_of_birth: string
          drinking: string | null
          education: Database["public"]["Enums"]["education_level"] | null
          email: string
          ethnicity: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          has_accommodation_available: boolean | null
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
          looking_for: string[] | null
          max_distance: number | null
          occupation: string | null
          personality_traits: Json | null
          professional_badge: string | null
          relationship_goals:
            | Database["public"]["Enums"]["relationship_goal"][]
            | null
          religion: string | null
          search_preferences: Json | null
          smoking: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          body_type?: string | null
          compatibility_score?: number | null
          created_at?: string | null
          date_of_birth: string
          drinking?: string | null
          education?: Database["public"]["Enums"]["education_level"] | null
          email: string
          ethnicity?: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          has_accommodation_available?: boolean | null
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
          looking_for?: string[] | null
          max_distance?: number | null
          occupation?: string | null
          personality_traits?: Json | null
          professional_badge?: string | null
          relationship_goals?:
            | Database["public"]["Enums"]["relationship_goal"][]
            | null
          religion?: string | null
          search_preferences?: Json | null
          smoking?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          body_type?: string | null
          compatibility_score?: number | null
          created_at?: string | null
          date_of_birth?: string
          drinking?: string | null
          education?: Database["public"]["Enums"]["education_level"] | null
          email?: string
          ethnicity?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          has_accommodation_available?: boolean | null
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
          looking_for?: string[] | null
          max_distance?: number | null
          occupation?: string | null
          personality_traits?: Json | null
          professional_badge?: string | null
          relationship_goals?:
            | Database["public"]["Enums"]["relationship_goal"][]
            | null
          religion?: string | null
          search_preferences?: Json | null
          smoking?: string | null
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
      rate_limits: {
        Row: {
          action_type: string
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          last_attempt: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          content_metadata: Json | null
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          content_metadata?: Json | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          content_metadata?: Json | null
          content_type?: string
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
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          content_type: string
          content_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          text_content: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          content_type: string
          content_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          text_content?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          text_content?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
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
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
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
      user_prompt_responses: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          prompt_id: string
          response_text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          prompt_id: string
          response_text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          prompt_id?: string
          response_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prompt_responses_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "icebreaker_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prompt_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          experience_points: number | null
          id: string
          last_login_date: string | null
          level: number | null
          likes_given: number | null
          likes_received: number | null
          login_streak: number | null
          profile_views: number | null
          super_likes_given: number | null
          super_likes_received: number | null
          total_conversations: number | null
          total_matches: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_points?: number | null
          id?: string
          last_login_date?: string | null
          level?: number | null
          likes_given?: number | null
          likes_received?: number | null
          login_streak?: number | null
          profile_views?: number | null
          super_likes_given?: number | null
          super_likes_received?: number | null
          total_conversations?: number | null
          total_matches?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          experience_points?: number | null
          id?: string
          last_login_date?: string | null
          level?: number | null
          likes_given?: number | null
          likes_received?: number | null
          login_streak?: number | null
          profile_views?: number | null
          super_likes_given?: number | null
          super_likes_received?: number | null
          total_conversations?: number | null
          total_matches?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
          profession: string | null
          professional_document_url: string | null
          reviewed_at: string | null
          selfie_url: string
          status: Database["public"]["Enums"]["verification_status"] | null
          user_id: string
          verification_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profession?: string | null
          professional_document_url?: string | null
          reviewed_at?: string | null
          selfie_url: string
          status?: Database["public"]["Enums"]["verification_status"] | null
          user_id: string
          verification_type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profession?: string | null
          professional_document_url?: string | null
          reviewed_at?: string | null
          selfie_url?: string
          status?: Database["public"]["Enums"]["verification_status"] | null
          user_id?: string
          verification_type?: string
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
      virtual_gifts: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string
          id: string
          is_active: boolean | null
          name: string
          price_in_points: number
          rarity: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url: string
          id?: string
          is_active?: boolean | null
          name: string
          price_in_points: number
          rarity?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price_in_points?: number
          rarity?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      check_achievements: { Args: { p_user_id: string }; Returns: undefined }
      check_daily_swipe_limit: { Args: { user_uuid: string }; Returns: number }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_max_attempts?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_fake_users: { Args: never; Returns: number }
      cleanup_inactive_accounts: { Args: never; Returns: number }
      create_notification: {
        Args: {
          notification_message: string
          notification_title: string
          notification_type: string
          related_match_id?: string
          related_user_id?: string
          target_user_id: string
        }
        Returns: string
      }
      detect_suspicious_activity: {
        Args: never
        Returns: {
          activity_type: string
          count: number
          last_occurrence: string
          user_id: string
        }[]
      }
      get_app_statistics: { Args: never; Returns: Json }
      get_compatible_profiles: {
        Args: {
          p_age_max?: number
          p_age_min?: number
          p_filter_education_levels?: string[]
          p_filter_interests?: string[]
          p_filter_relationship_goals?: string[]
          p_height_max?: number
          p_height_min?: number
          p_max_distance?: number
          user_uuid: string
        }
        Returns: {
          bio: string
          compatibility_score: number
          date_of_birth: string
          distance_km: number
          education: string
          first_name: string
          height_cm: number
          id: string
          interests: string[]
          location_city: string
          location_state: string
          occupation: string
          relationship_goals: string[]
        }[]
      }
      get_current_user_subscription: {
        Args: never
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      get_discovery_profiles: {
        Args: {
          p_age_max?: number
          p_age_min?: number
          p_body_types?: string[]
          p_drinking?: string
          p_ethnicities?: string[]
          p_filter_education_levels?: string[]
          p_filter_interests?: string[]
          p_filter_relationship_goals?: string[]
          p_height_max?: number
          p_height_min?: number
          p_max_distance?: number
          p_religion?: string
          p_smoking?: string
          user_uuid: string
        }
        Returns: {
          bio: string
          boost_active: boolean
          compatibility_score: number
          date_of_birth: string
          distance_km: number
          education: string
          first_name: string
          height_cm: number
          id: string
          interests: string[]
          last_active: string
          location_city: string
          location_state: string
          occupation: string
          relationship_goals: string[]
        }[]
      }
      get_enhanced_compatible_profiles: {
        Args: {
          p_age_max?: number
          p_age_min?: number
          p_body_types?: string[]
          p_drinking?: string
          p_ethnicities?: string[]
          p_filter_education_levels?: string[]
          p_filter_interests?: string[]
          p_filter_relationship_goals?: string[]
          p_height_max?: number
          p_height_min?: number
          p_max_distance?: number
          p_religion?: string
          p_smoking?: string
          user_uuid: string
        }
        Returns: {
          bio: string
          boost_active: boolean
          compatibility_score: number
          date_of_birth: string
          distance_km: number
          education: string
          first_name: string
          height_cm: number
          id: string
          interests: string[]
          last_active: string
          location_city: string
          location_state: string
          occupation: string
          relationship_goals: string[]
        }[]
      }
      get_safe_discovery_profiles: {
        Args: {
          p_age_max?: number
          p_age_min?: number
          p_max_distance?: number
          requesting_user_id: string
        }
        Returns: {
          age: number
          bio: string
          compatibility_score: number
          distance_km: number
          first_name: string
          general_location: string
          height_cm: number
          id: string
          interests: string[]
          is_verified: boolean
          last_active: string
          occupation: string
          relationship_goals: string[]
        }[]
      }
      get_safe_profile_data: {
        Args: { profile_id: string }
        Returns: {
          age: number
          bio: string
          education: string
          first_name: string
          general_city: string
          has_accommodation_available: boolean
          height_cm: number
          id: string
          interests: string[]
          is_verified: boolean
          last_active: string
          occupation: string
          relationship_goals: string[]
        }[]
      }
      get_safe_profiles_for_user: {
        Args: { user_uuid: string }
        Returns: {
          bio: string
          date_of_birth: string
          education: Database["public"]["Enums"]["education_level"]
          first_name: string
          has_accommodation_available: boolean
          height_cm: number
          id: string
          interests: string[]
          is_active: boolean
          last_active: string
          location_city: string
          location_state: string
          occupation: string
          relationship_goals: Database["public"]["Enums"]["relationship_goal"][]
        }[]
      }
      get_secure_discovery_profiles: {
        Args: {
          p_age_max?: number
          p_age_min?: number
          p_limit?: number
          p_max_distance?: number
          requesting_user_id: string
        }
        Returns: {
          age: number
          bio: string
          compatibility_score: number
          distance_km: number
          first_name: string
          general_location: string
          has_accommodation_available: boolean
          height_cm: number
          id: string
          interests: string[]
          is_verified: boolean
          last_active: string
          occupation: string
          relationship_goals: string[]
        }[]
      }
      get_user_subscription_tier: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      get_verification_document_secure: {
        Args: { p_document_type?: string; p_request_id: string }
        Returns: string
      }
      get_verification_document_url: {
        Args: { p_document_type?: string; p_request_id: string }
        Returns: string
      }
      get_verification_document_url_secure: {
        Args: { p_document_type?: string; p_request_id: string }
        Returns: string
      }
      get_verification_document_with_audit: {
        Args: { p_document_type?: string; p_request_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      increment_swipe_count: { Args: { user_uuid: string }; Returns: undefined }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      make_user_admin: { Args: { user_email: string }; Returns: undefined }
      mark_notifications_read: {
        Args: { notification_ids: string[] }
        Returns: undefined
      }
      sanitize_message_content: {
        Args: { p_content: string; p_user_id?: string }
        Returns: string
      }
    }
    Enums: {
      accommodation_type: "hotel" | "apartment" | "resort" | "villa" | "cabin"
      app_role: "lodge_manager" | "admin"
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
    Enums: {
      accommodation_type: ["hotel", "apartment", "resort", "villa", "cabin"],
      app_role: ["lodge_manager", "admin"],
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
