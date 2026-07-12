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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      article_authors: {
        Row: {
          article_id: string
          profile_id: string
        }
        Insert: {
          article_id: string
          profile_id: string
        }
        Update: {
          article_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_authors_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_authors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          body: string | null
          body_html: string | null
          canonical_url: string | null
          category_id: string | null
          cover_alt: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          format_id: string | null
          id: string
          kicker: string | null
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          published_at: string | null
          reading_time: number | null
          search_tsv: unknown
          series_id: string | null
          series_order: number | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          subtitle: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          body?: string | null
          body_html?: string | null
          canonical_url?: string | null
          category_id?: string | null
          cover_alt?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          format_id?: string | null
          id?: string
          kicker?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          published_at?: string | null
          reading_time?: number | null
          search_tsv?: unknown
          series_id?: string | null
          series_order?: number | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          body?: string | null
          body_html?: string | null
          canonical_url?: string | null
          category_id?: string | null
          cover_alt?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          format_id?: string | null
          id?: string
          kicker?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          published_at?: string | null
          reading_time?: number | null
          search_tsv?: unknown
          series_id?: string | null
          series_order?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      author_applications: {
        Row: {
          bio: string
          created_at: string
          id: string
          profile_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          topics: string
          writing_links: string | null
        }
        Insert: {
          bio: string
          created_at?: string
          id?: string
          profile_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          topics: string
          writing_links?: string | null
        }
        Update: {
          bio?: string
          created_at?: string
          id?: string
          profile_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          topics?: string
          writing_links?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "author_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "author_applications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      cheat_sheets: {
        Row: {
          author_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          download_url: string | null
          id: string
          image_url: string
          published: boolean
          search_tsv: unknown
          slug: string
          thumb_url: string | null
          title: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          download_url?: string | null
          id?: string
          image_url: string
          published?: boolean
          search_tsv?: unknown
          slug: string
          thumb_url?: string | null
          title: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          download_url?: string | null
          id?: string
          image_url?: string
          published?: boolean
          search_tsv?: unknown
          slug?: string
          thumb_url?: string | null
          title?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "cheat_sheets_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheat_sheets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          profile_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          profile_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          article_id: string
          body: string
          created_at: string
          id: string
          is_approved: boolean
          parent_id: string | null
          profile_id: string
        }
        Insert: {
          article_id: string
          body: string
          created_at?: string
          id?: string
          is_approved?: boolean
          parent_id?: string | null
          profile_id: string
        }
        Update: {
          article_id?: string
          body?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          parent_id?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          id: string
          resend_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id: string
          resend_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          resend_id?: string | null
          type?: string
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          created_at: string
          email: string
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          reason?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category_id: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          host: string | null
          id: string
          is_featured: boolean
          is_online: boolean
          location: string | null
          published: boolean
          register_url: string | null
          search_tsv: unknown
          slug: string
          starts_at: string
          summary: string | null
          timezone: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          host?: string | null
          id?: string
          is_featured?: boolean
          is_online?: boolean
          location?: string | null
          published?: boolean
          register_url?: string | null
          search_tsv?: unknown
          slug: string
          starts_at: string
          summary?: string | null
          timezone?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          host?: string | null
          id?: string
          is_featured?: boolean
          is_online?: boolean
          location?: string | null
          published?: boolean
          register_url?: string | null
          search_tsv?: unknown
          slug?: string
          starts_at?: string
          summary?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          author_id: string | null
          category_id: string | null
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      formats: {
        Row: {
          color: Database["public"]["Enums"]["accent_color"]
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: Database["public"]["Enums"]["accent_color"]
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: Database["public"]["Enums"]["accent_color"]
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      guidebooks: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          download_count: number
          file_url: string
          id: string
          slug: string
          title: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          file_url: string
          id?: string
          slug: string
          title: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          file_url?: string
          id?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          apply_url: string
          brand_color: string | null
          company: string
          company_logo: string | null
          id: string
          is_active: boolean
          is_remote: boolean
          location: string | null
          posted_at: string
          salary_range: string | null
          tags: string[]
          title: string
        }
        Insert: {
          apply_url: string
          brand_color?: string | null
          company: string
          company_logo?: string | null
          id?: string
          is_active?: boolean
          is_remote?: boolean
          location?: string | null
          posted_at?: string
          salary_range?: string | null
          tags?: string[]
          title: string
        }
        Update: {
          apply_url?: string
          brand_color?: string | null
          company?: string
          company_logo?: string | null
          id?: string
          is_active?: boolean
          is_remote?: boolean
          location?: string | null
          posted_at?: string
          salary_range?: string | null
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      menu_links: {
        Row: {
          icon: string | null
          id: string
          is_active: boolean
          is_button: boolean
          is_external: boolean
          label: string
          location: Database["public"]["Enums"]["menu_location"]
          sort_order: number
          url: string
        }
        Insert: {
          icon?: string | null
          id?: string
          is_active?: boolean
          is_button?: boolean
          is_external?: boolean
          label: string
          location: Database["public"]["Enums"]["menu_location"]
          sort_order?: number
          url: string
        }
        Update: {
          icon?: string | null
          id?: string
          is_active?: boolean
          is_button?: boolean
          is_external?: boolean
          label?: string
          location?: Database["public"]["Enums"]["menu_location"]
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      newsletter_issues: {
        Row: {
          body: string | null
          bounced_count: number
          complained_count: number
          content: Json
          created_at: string
          delivered_count: number
          id: string
          issue_number: number
          open_rate: number | null
          opened_count: number
          recipients: number | null
          scheduled_for: string | null
          sent_at: string | null
          slug: string
          started_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
          summary: string | null
          title: string
        }
        Insert: {
          body?: string | null
          bounced_count?: number
          complained_count?: number
          content?: Json
          created_at?: string
          delivered_count?: number
          id?: string
          issue_number: number
          open_rate?: number | null
          opened_count?: number
          recipients?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          slug: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          summary?: string | null
          title: string
        }
        Update: {
          body?: string | null
          bounced_count?: number
          complained_count?: number
          content?: Json
          created_at?: string
          delivered_count?: number
          id?: string
          issue_number?: number
          open_rate?: number | null
          opened_count?: number
          recipients?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          slug?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      newsletter_sends: {
        Row: {
          created_at: string
          email: string
          error: string | null
          id: string
          issue_id: string
          opened_at: string | null
          resend_id: string | null
          sent_at: string | null
          status: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          email: string
          error?: string | null
          id?: string
          issue_id: string
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subscriber_id: string
        }
        Update: {
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          issue_id?: string
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_sends_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          source: string | null
          status: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token: string
        }
        Insert: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token?: string
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_name: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          url: string
          user_id: string
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type: string
          url: string
          user_id: string
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          slug: string | null
          socials: Json
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          slug?: string | null
          socials?: Json
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          slug?: string | null
          socials?: Json
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          cta_label: string
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          cta_label?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          url: string
        }
        Update: {
          created_at?: string
          cta_label?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          url?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          slug: string
          title: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          slug: string
          title: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          contact_email: string | null
          default_meta_description: string | null
          default_meta_title: string | null
          default_og_image: string | null
          editor_badges: Json
          editor_bio: string | null
          editor_headline: string | null
          editor_profile_id: string | null
          established_year: number | null
          hero_article_id: string | null
          id: boolean
          logo_url: string | null
          newsletter_headline: string | null
          newsletter_show_stats: boolean
          newsletter_stat_override: Json | null
          newsletter_subtext: string | null
          site_name: string
          socials: Json
          spotlight_body: string | null
          spotlight_cta_url: string | null
          spotlight_headline: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          default_meta_description?: string | null
          default_meta_title?: string | null
          default_og_image?: string | null
          editor_badges?: Json
          editor_bio?: string | null
          editor_headline?: string | null
          editor_profile_id?: string | null
          established_year?: number | null
          hero_article_id?: string | null
          id?: boolean
          logo_url?: string | null
          newsletter_headline?: string | null
          newsletter_show_stats?: boolean
          newsletter_stat_override?: Json | null
          newsletter_subtext?: string | null
          site_name?: string
          socials?: Json
          spotlight_body?: string | null
          spotlight_cta_url?: string | null
          spotlight_headline?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          default_meta_description?: string | null
          default_meta_title?: string | null
          default_og_image?: string | null
          editor_badges?: Json
          editor_bio?: string | null
          editor_headline?: string | null
          editor_profile_id?: string | null
          established_year?: number | null
          hero_article_id?: string | null
          id?: boolean
          logo_url?: string | null
          newsletter_headline?: string | null
          newsletter_show_stats?: boolean
          newsletter_stat_override?: Json | null
          newsletter_subtext?: string | null
          site_name?: string
          socials?: Json
          spotlight_body?: string | null
          spotlight_cta_url?: string | null
          spotlight_headline?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_editor_profile_id_fkey"
            columns: ["editor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_hero_article_id_fkey"
            columns: ["hero_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      ticker_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          text: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          text: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          text?: string
          url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      claim_issue_for_sending: {
        Args: { p_issue_id: string }
        Returns: boolean
      }
      claim_send_batch: {
        Args: { p_issue_id: string; p_limit: number }
        Returns: {
          created_at: string
          email: string
          error: string | null
          id: string
          issue_id: string
          opened_at: string | null
          resend_id: string | null
          sent_at: string | null
          status: string
          subscriber_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "newsletter_sends"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      current_role_is: {
        Args: { check_roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      increment_view: { Args: { article_slug: string }; Returns: undefined }
      prune_rate_limits: { Args: never; Returns: undefined }
      record_email_event: {
        Args: {
          p_event_id: string
          p_hard: boolean
          p_resend_id: string
          p_type: string
        }
        Returns: boolean
      }
      search_content: {
        Args: { max_results?: number; q: string }
        Returns: {
          category: string
          description: string
          kind: string
          rank: number
          title: string
          url: string
        }[]
      }
    }
    Enums: {
      accent_color: "gold" | "teal" | "red"
      application_status: "pending" | "approved" | "rejected"
      article_status:
        | "draft"
        | "in_review"
        | "changes_requested"
        | "published"
        | "archived"
      issue_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "sent"
        | "failed"
        | "canceled"
      menu_location:
        | "header"
        | "footer_topics"
        | "footer_resources"
        | "footer_company"
        | "social"
      subscriber_status: "pending" | "confirmed" | "unsubscribed"
      user_role: "admin" | "editor" | "author" | "reader"
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
      accent_color: ["gold", "teal", "red"],
      application_status: ["pending", "approved", "rejected"],
      article_status: [
        "draft",
        "in_review",
        "changes_requested",
        "published",
        "archived",
      ],
      issue_status: [
        "draft",
        "scheduled",
        "sending",
        "sent",
        "failed",
        "canceled",
      ],
      menu_location: [
        "header",
        "footer_topics",
        "footer_resources",
        "footer_company",
        "social",
      ],
      subscriber_status: ["pending", "confirmed", "unsubscribed"],
      user_role: ["admin", "editor", "author", "reader"],
    },
  },
} as const
