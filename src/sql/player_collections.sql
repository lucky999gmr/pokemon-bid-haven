
-- Create a table for player collections
CREATE TABLE IF NOT EXISTS public.player_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) NOT NULL,
  pokemon_id INTEGER NOT NULL,
  pokemon_name TEXT NOT NULL,
  pokemon_image TEXT NOT NULL,
  acquisition_price INTEGER NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create an RPC function to safely decrement a player's balance
CREATE OR REPLACE FUNCTION public.decrement_balance(player_id UUID, amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.player_balances
  WHERE player_balances.player_id = $1;
  
  -- Return the new balance (or current if amount > current)
  RETURN GREATEST(0, current_balance - $2);
END;
$$;

-- Add columns to the nominated_pokemon table if they don't exist
DO $$
BEGIN
  -- Add current_turn_player_id column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nominated_pokemon' 
    AND column_name = 'current_turn_player_id'
  ) THEN
    ALTER TABLE public.nominated_pokemon ADD COLUMN current_turn_player_id UUID REFERENCES public.players(id);
  END IF;
  
  -- Add last_bid_at column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nominated_pokemon' 
    AND column_name = 'last_bid_at'
  ) THEN
    ALTER TABLE public.nominated_pokemon ADD COLUMN last_bid_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add auction_status column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nominated_pokemon' 
    AND column_name = 'auction_status'
  ) THEN
    ALTER TABLE public.nominated_pokemon ADD COLUMN auction_status TEXT NOT NULL DEFAULT 'active';
  END IF;
  
  -- Add time_per_turn column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nominated_pokemon' 
    AND column_name = 'time_per_turn'
  ) THEN
    ALTER TABLE public.nominated_pokemon ADD COLUMN time_per_turn INTEGER NOT NULL DEFAULT 30;
  END IF;
END $$;
