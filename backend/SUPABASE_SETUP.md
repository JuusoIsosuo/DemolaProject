# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project
3. Note your project URL and API key (anon/public key)

## 2. Set Up Environment Variables

Add the following to your `.env` file:

```
DATABASE_URL=https://your-project-id.supabase.co
DATABASE_KEY=your-supabase-anon-key
```

## 3. Create Database Tables

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` and run it in the SQL Editor
3. This will create the necessary tables and set up Row Level Security (RLS)

## 4. Row Level Security (RLS)

The schema includes Row Level Security policies that:
- Allow public read access to all tables
- Restrict write operations (INSERT, UPDATE, DELETE) to authenticated users only

If you need to modify these policies:
1. Go to Authentication > Policies in your Supabase dashboard
2. Select the table you want to modify
3. Add, edit, or remove policies as needed

## 5. Using the Supabase Client in Your Code

The database configuration has been updated to use the Supabase client instead of Sequelize. Here's how to use it:

```javascript
const supabase = require('./config/database');

// Example: Insert a location
async function addLocation(name, coordinates) {
  const { data, error } = await supabase
    .from('locations')
    .insert([{ name, coordinates }]);
  
  if (error) throw error;
  return data;
}

// Example: Get all locations
async function getLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*');
  
  if (error) throw error;
  return data;
}

// Example: Add a connection
async function addConnection(fromLocationId, toLocationId, transport, distance, emission, time, geometry) {
  const { data, error } = await supabase
    .from('connections')
    .insert([{
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      transport,
      distance,
      emission,
      time,
      geometry
    }]);
  
  if (error) throw error;
  return data;
}

// Example: Get connections by transport type
async function getConnectionsByTransport(transport) {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('transport', transport);
  
  if (error) throw error;
  return data;
}
```

## 6. Authentication (Optional)

If you need to implement authentication:

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your authentication providers
3. Use the Supabase Auth methods in your code:

```javascript
// Sign up
const { user, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
});

// Sign in
const { user, error } = await supabase.auth.signIn({
  email: 'example@email.com',
  password: 'example-password',
});

// Sign out
const { error } = await supabase.auth.signOut();
```

## 7. Updating Your Application Code

You'll need to update your application code to use the Supabase client instead of Sequelize. The main changes will be:

1. Replace Sequelize model operations with Supabase queries
2. Update any code that relies on Sequelize-specific features
3. Modify your data access patterns to match the Supabase REST API style 