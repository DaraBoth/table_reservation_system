export type UserRole = 'superadmin' | 'admin' | 'staff'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          slug: string
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          logo_url: string | null
          subscription_expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          logo_url?: string | null
          subscription_expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      account_memberships: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string | null
          role: UserRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id?: string | null
          role: UserRole
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['account_memberships']['Insert']>
        Relationships: []
      }
      physical_tables: {
        Row: {
          id: string
          restaurant_id: string
          table_name: string
          capacity: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_name: string
          capacity?: number
          description?: string | null
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['physical_tables']['Insert']>
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          restaurant_id: string
          table_id: string
          guest_name: string
          guest_phone: string | null
          guest_email: string | null
          party_size: number
          notes: string | null
          status: ReservationStatus
          reservation_time: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_id: string
          guest_name: string
          guest_phone?: string | null
          guest_email?: string | null
          party_size?: number
          notes?: string | null
          status?: ReservationStatus
          reservation_time: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_superadmin: { Args: Record<PropertyKey, never>; Returns: boolean }
      has_role_on_restaurant: { Args: { p_restaurant_id: string; p_roles: UserRole[] }; Returns: boolean }
      my_restaurant_id: { Args: Record<PropertyKey, never>; Returns: string | null }
    }
    Enums: {
      user_role: UserRole
      reservation_status: ReservationStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row types
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type AccountMembership = Database['public']['Tables']['account_memberships']['Row']
export type PhysicalTable = Database['public']['Tables']['physical_tables']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']

// Extended types with joins
export type MembershipWithProfile = AccountMembership & { profiles: Profile | null }
export type ReservationWithTable = Reservation & { physical_tables: PhysicalTable | null }
