-- Create movies table
CREATE TABLE public.movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  year INTEGER NOT NULL,
  description TEXT,
  poster_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user ratings table
CREATE TABLE public.user_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Create user preferences table for personalization
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  favorite_genres TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for movies (public read, no write for now)
CREATE POLICY "Movies are viewable by everyone" 
  ON public.movies FOR SELECT 
  USING (true);

-- Policies for user ratings
CREATE POLICY "Users can view their own ratings" 
  ON public.user_ratings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ratings" 
  ON public.user_ratings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
  ON public.user_ratings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
  ON public.user_ratings FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for user preferences
CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
  ON public.user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_movies_genre ON public.movies(genre);
CREATE INDEX idx_movies_year ON public.movies(year);
CREATE INDEX idx_movies_rating ON public.movies(rating DESC);
CREATE INDEX idx_user_ratings_user_id ON public.user_ratings(user_id);
CREATE INDEX idx_user_ratings_movie_id ON public.user_ratings(movie_id);

-- Insert sample movies
INSERT INTO public.movies (title, genre, year, description, poster_url, rating) VALUES
('Inception', 'Sci-Fi', 2010, 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400', 4.8),
('The Shawshank Redemption', 'Drama', 1994, 'Two imprisoned men bond over a number of years, finding solace and eventual redemption.', 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400', 4.9),
('The Dark Knight', 'Action', 2008, 'Batman must accept one of the greatest psychological tests to fight injustice.', 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400', 4.7),
('Pulp Fiction', 'Crime', 1994, 'The lives of two mob hitmen, a boxer, and a pair of diner bandits intertwine.', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400', 4.6),
('Forrest Gump', 'Drama', 1994, 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man.', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400', 4.8),
('The Matrix', 'Sci-Fi', 1999, 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.', 'https://images.unsplash.com/photo-1574267432644-f74f260c58b7?w=400', 4.7),
('Interstellar', 'Sci-Fi', 2014, 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400', 4.8),
('Goodfellas', 'Crime', 1990, 'The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen.', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400', 4.7),
('The Silence of the Lambs', 'Thriller', 1991, 'A young FBI cadet must receive help from a manipulative cannibal to catch another serial killer.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', 4.6),
('Gladiator', 'Action', 2000, 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400', 4.5);