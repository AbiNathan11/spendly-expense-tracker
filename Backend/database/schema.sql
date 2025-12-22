-- Spendly Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to insert their own row
CREATE POLICY "Allow self insert" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Allow users to select their own row
CREATE POLICY "Allow self select" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Allow users to update their own row
CREATE POLICY "Allow self update" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Allow users to delete their own row
CREATE POLICY "Allow self delete" ON users
  FOR DELETE
  USING (auth.uid() = id);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name VARCHAR(255),
  daily_budget DECIMAL(10, 2) DEFAULT 1000.00,
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Envelopes Table
CREATE TABLE IF NOT EXISTS envelopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  allocated_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  envelope_id UUID REFERENCES envelopes(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  shop_name VARCHAR(255),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date TIMESTAMP WITH TIME ZONE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_envelopes_user_id ON envelopes(user_id);
CREATE INDEX idx_envelopes_month_year ON envelopes(month, year);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_envelope_id ON expenses(envelope_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_is_paid ON bills(is_paid);

-- Enable Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for envelopes
CREATE POLICY "Users can view their own envelopes"
  ON envelopes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own envelopes"
  ON envelopes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own envelopes"
  ON envelopes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own envelopes"
  ON envelopes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bills
CREATE POLICY "Users can view their own bills"
  ON bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON bills FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_envelopes_updated_at
  BEFORE UPDATE ON envelopes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for receipts (Run this in Supabase Storage UI or via SQL)
-- You'll need to create this bucket manually in Supabase Dashboard:
-- Bucket name: receipts
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/jpg
