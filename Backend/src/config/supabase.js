const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for user-authenticated requests
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
//const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Admin client for server-side operations (only if service key exists)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;


module.exports = {
  supabase,
  supabaseAdmin
};
