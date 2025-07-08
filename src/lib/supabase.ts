import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserProfile {
  id: string;
  role: 'buyer' | 'seller';
  full_name: string;
  phone_number: string;
  email: string;
  business_name?: string;
  business_registration_number?: string;
  business_address?: string;
  whatsapp_number?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  stock_quantity: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  views: number;
  created_at: string;
  updated_at: string;
  seller?: UserProfile;
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  buyer?: UserProfile;
  seller?: UserProfile;
  order_items?: OrderItem[];
  payment_receipts?: PaymentReceipt[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: Product;
}

export interface PaymentReceipt {
  id: string;
  order_id: string;
  receipt_url: string;
  uploaded_by: string;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
}

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Fetching user profile for:', userId);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    console.log('User profile fetched:', data);
    return data;
  } catch (err) {
    console.error('Exception fetching user profile:', err);
    return null;
  }
};

export const signUp = async (email: string, password: string, profileData: Partial<UserProfile>) => {
  try {
    console.log('Starting signup process for:', email);
    console.log('Profile data to create:', profileData);

    // First, sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          email_confirm: false
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user returned from signup');
    }

    console.log('Auth user created:', authData.user.id);

    // Verify the user is properly authenticated
    if (!authData.session) {
      console.log('No session created, user may need email confirmation');
    }

    // Create the user profile
    const profileToInsert = {
      id: authData.user.id,
      email: authData.user.email || email,
      ...profileData,
    };

    console.log('Inserting profile:', profileToInsert);

    const { data: profileResult, error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileToInsert)
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log('Profile created successfully:', profileResult);
    return { user: authData.user, profile: profileResult };

  } catch (error) {
    console.error('Signup process failed:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('Starting signin process for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Signin error:', error);
      throw error;
    }

    console.log('Signin successful for user:', data.user?.id);
    return data;

  } catch (error) {
    console.error('Signin process failed:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log('Starting signout process');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Signout error:', error);
      throw error;
    }
    
    console.log('Signout successful');
  } catch (error) {
    console.error('Signout process failed:', error);
    throw error;
  }
};