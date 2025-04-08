const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

if (!process.env.DATABASE_KEY) {
  throw new Error('DATABASE_KEY is not defined in environment variables');
}

// Create Supabase client
const supabaseUrl = process.env.DATABASE_URL;
const supabaseKey = process.env.DATABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase; 