-- Drive Market Supabase setup
-- Run in Supabase Dashboard > SQL Editor.
-- For a real public marketplace, add authentication, spam prevention,
-- and stricter permissions before production use.

CREATE TABLE IF NOT EXISTS public.cars (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    year INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    fuel TEXT NOT NULL,
    transmission TEXT NOT NULL,
    km INTEGER DEFAULT 0,
    location TEXT DEFAULT 'India',
    image TEXT NOT NULL,
    description TEXT DEFAULT ''
);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.cars TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view car listings" ON public.cars;
CREATE POLICY "Anyone can view car listings"
ON public.cars FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Visitors can add car listings" ON public.cars;
CREATE POLICY "Visitors can add car listings"
ON public.cars FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Create a Storage bucket named car-photos in the Supabase dashboard.
-- Set it to Public so images can be displayed using their public URLs.
DROP POLICY IF EXISTS "Public can upload car photos" ON storage.objects;
CREATE POLICY "Public can upload car photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'car-photos');
