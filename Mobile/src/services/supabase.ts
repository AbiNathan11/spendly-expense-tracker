import { createClient } from "@supabase/supabase-js";

// 🔴 replace with YOUR values
const SUPABASE_URL = "https://crkxvyhwmeesnmwucorr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3h2eWh3bWVlc25td3Vjb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzEzMDIsImV4cCI6MjA4MTI0NzMwMn0.uac6CxihWJirt98oIC_Wr-pkDKjxLZhI-3RQP85qhu0";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
