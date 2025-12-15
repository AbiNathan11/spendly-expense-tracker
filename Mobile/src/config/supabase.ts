/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://crkxvyhwmeesnmwucorr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3h2eWh3bWVlc25td3Vjb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzEzMDIsImV4cCI6MjA4MTI0NzMwMn0.uac6CxihWJirt98oIC_Wr-pkDKjxLZhI-3RQP85qhu0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

/**
 * Get current user's JWT token
 */
export const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};
