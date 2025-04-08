-- Create the locations table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  coordinates JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the connections table
CREATE TABLE connections (
  id SERIAL PRIMARY KEY,
  from_location_id INTEGER NOT NULL REFERENCES locations(id),
  to_location_id INTEGER NOT NULL REFERENCES locations(id),
  transport TEXT NOT NULL CHECK (transport IN ('air', 'sea', 'rail', 'truck')),
  distance FLOAT NOT NULL,
  emission FLOAT NOT NULL,
  time FLOAT NOT NULL,
  geometry JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_connections_from_location ON connections(from_location_id);
CREATE INDEX idx_connections_to_location ON connections(to_location_id);
CREATE INDEX idx_connections_transport ON connections(transport);

-- Enable Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create policies for locations table
CREATE POLICY "Allow public access to locations" 
  ON locations FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create policies for connections table
CREATE POLICY "Allow public access to connections" 
  ON connections FOR ALL 
  USING (true)
  WITH CHECK (true); 