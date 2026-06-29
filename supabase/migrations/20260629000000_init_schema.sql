-- 1. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create cards table
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    front_image_url TEXT NOT NULL,
    back_image_url TEXT NOT NULL,
    sport TEXT NOT NULL CHECK (sport IN ('Baseball', 'Basketball', 'Football', 'Soccer', 'Hockey', 'Other')),
    player_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    brand TEXT NOT NULL,
    card_number TEXT NOT NULL,
    is_rookie BOOLEAN NOT NULL DEFAULT false,
    is_insert BOOLEAN NOT NULL DEFAULT false,
    is_autographed BOOLEAN NOT NULL DEFAULT false,
    is_memorabilia BOOLEAN NOT NULL DEFAULT false,
    parallel_attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Automatically create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (new.id, new.raw_user_meta_data->>'username');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for profiles
CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id);

-- 6. RLS Policies for cards
CREATE POLICY "Allow users to read their own cards" 
    ON public.cards FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own cards" 
    ON public.cards FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own cards" 
    ON public.cards FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own cards" 
    ON public.cards FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);
