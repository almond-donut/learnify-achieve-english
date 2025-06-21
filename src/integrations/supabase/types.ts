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
      achievements: {
        Row: {
          badge_icon: string | null
          created_at: string | null
          description: string
          id: string
          name: string
          points_reward: number | null
          requirements: Json
        }
        Insert: {
          badge_icon?: string | null
          created_at?: string | null
          description: string
          id?: string
          name: string
          points_reward?: number | null
          requirements: Json
        }
        Update: {
          badge_icon?: string | null
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          points_reward?: number | null
          requirements?: Json
        }
        Relationships: []
      }
      class_quizzes: {
        Row: {
          assigned_at: string | null
          class_id: string | null
          due_date: string | null
          id: string
          quiz_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          class_id?: string | null
          due_date?: string | null
          id?: string
          quiz_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          class_id?: string | null
          due_date?: string | null
          id?: string
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_quizzes_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          id: string
          name: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      context_sessions: {
        Row: {
          activities: Json | null
          context_summary: string | null
          id: string
          performance_metrics: Json | null
          session_end: string | null
          session_start: string | null
          total_duration_minutes: number | null
          user_id: string | null
        }
        Insert: {
          activities?: Json | null
          context_summary?: string | null
          id?: string
          performance_metrics?: Json | null
          session_end?: string | null
          session_start?: string | null
          total_duration_minutes?: number | null
          user_id?: string | null
        }
        Update: {
          activities?: Json | null
          context_summary?: string | null
          id?: string
          performance_metrics?: Json | null
          session_end?: string | null
          session_start?: string | null
          total_duration_minutes?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      learning_patterns: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          last_updated: string | null
          pattern_data: Json
          pattern_type: string
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          pattern_data: Json
          pattern_type: string
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          pattern_data?: Json
          pattern_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      memory_entries: {
        Row: {
          content: Json
          context_tags: string[] | null
          created_at: string | null
          embedding: string | null
          entry_type: string
          expires_at: string | null
          id: string
          importance_score: number | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          content: Json
          context_tags?: string[] | null
          created_at?: string | null
          embedding?: string | null
          entry_type: string
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: Json
          context_tags?: string[] | null
          created_at?: string | null
          embedding?: string | null
          entry_type?: string
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      memory_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          recommendation_data: Json
          recommendation_type: string
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          recommendation_data: Json
          recommendation_type: string
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          recommendation_data?: Json
          recommendation_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number | null
          points: number | null
          question_text: string
          quiz_id: string | null
        }
        Insert: {
          correct_answer: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index?: number | null
          points?: number | null
          question_text: string
          quiz_id?: string | null
        }
        Update: {
          correct_answer?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          order_index?: number | null
          points?: number | null
          question_text?: string
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["quiz_difficulty"] | null
          id: string
          points_per_question: number | null
          time_limit: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["quiz_difficulty"] | null
          id?: string
          points_per_question?: number | null
          time_limit?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["quiz_difficulty"] | null
          id?: string
          points_per_question?: number | null
          time_limit?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar_url: string | null
          class_id: string | null
          created_at: string | null
          current_streak: number | null
          email: string
          id: string
          last_login: string | null
          level: number | null
          name: string
          student_id: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          class_id?: string | null
          created_at?: string | null
          current_streak?: number | null
          email: string
          id?: string
          last_login?: string | null
          level?: number | null
          name: string
          student_id: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          class_id?: string | null
          created_at?: string | null
          current_streak?: number | null
          email?: string
          id?: string
          last_login?: string | null
          level?: number | null
          name?: string
          student_id?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          student_id?: string | null
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
            foreignKeyName: "user_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number
          id: string
          points_earned: number
          quiz_id: string | null
          score: number
          student_id: string | null
          time_taken: number | null
          total_questions: number
        }
        Insert: {
          completed_at?: string | null
          correct_answers: number
          id?: string
          points_earned: number
          quiz_id?: string | null
          score: number
          student_id?: string | null
          time_taken?: number | null
          total_questions: number
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          id?: string
          points_earned?: number
          quiz_id?: string | null
          score?: number
          student_id?: string | null
          time_taken?: number | null
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_memory_entry: {
        Args: {
          p_user_id: string
          p_entry_type: string
          p_content: Json
          p_context_tags?: string[]
          p_importance_score?: number
          p_expires_days?: number
        }
        Returns: string
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_and_award_achievements: {
        Args: { p_student_id: string }
        Returns: {
          achievement_id: string
          achievement_name: string
        }[]
      }
      cleanup_expired_memories: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      end_context_session: {
        Args: {
          p_session_id: string
          p_activities?: Json
          p_performance_metrics?: Json
          p_context_summary?: string
        }
        Returns: boolean
      }
      generate_memory_recommendations: {
        Args: { p_user_id: string }
        Returns: {
          recommendation_type: string
          recommendation_data: Json
          confidence_score: number
        }[]
      }
      get_relevant_memories: {
        Args: {
          p_user_id: string
          p_entry_types?: string[]
          p_context_tags?: string[]
          p_limit?: number
        }
        Returns: {
          id: string
          entry_type: string
          content: Json
          context_tags: string[]
          importance_score: number
          created_at: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      start_context_session: {
        Args: { p_user_id: string }
        Returns: string
      }
      update_learning_pattern: {
        Args: {
          p_user_id: string
          p_pattern_type: string
          p_pattern_data: Json
          p_confidence_score?: number
        }
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      quiz_difficulty: "easy" | "medium" | "hard"
      user_role: "teacher" | "student"
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
      quiz_difficulty: ["easy", "medium", "hard"],
      user_role: ["teacher", "student"],
    },
  },
} as const
