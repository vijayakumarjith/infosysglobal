import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjkwNzIwMCwiZXhwIjoxOTYyNDgzMjAwfQ.LqfqgX_DuHmSEvnedNjqy1x1JiMpjvxPjU0Q7N0Cd4s';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('Using demo Supabase configuration for development.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  email: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  badges: string[];
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_score: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  caption: string;
  images: string[];
  location: string;
  category: string;
  rating: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: Profile;
};

export type Place = {
  id: string;
  name: string;
  location: string;
  description?: string;
  category: string;
  average_rating: number;
  total_reviews: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  place_id: string;
  vehicle_type: string;
  distance_km: number;
  fuel_cost: number;
  total_fare: number;
  status: string;
  created_at: string;
};