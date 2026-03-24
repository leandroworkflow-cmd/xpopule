
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
