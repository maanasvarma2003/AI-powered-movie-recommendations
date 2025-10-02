import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MovieCard from './MovieCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  genre: string;
  year: number;
  description: string;
  poster_url: string;
  rating: number;
}

export default function MovieGrid() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  const fetchMovies = async () => {
    const { data } = await supabase
      .from('movies')
      .select('*')
      .order('rating', { ascending: false });

    if (data) {
      setMovies(data);
      setFilteredMovies(data);
    }
  };

  const fetchUserRatings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_ratings')
      .select('movie_id, rating')
      .eq('user_id', user.id);

    if (data) {
      const ratingsMap: Record<string, number> = {};
      data.forEach(r => ratingsMap[r.movie_id] = r.rating);
      setUserRatings(ratingsMap);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchUserRatings();
  }, []);

  useEffect(() => {
    let filtered = movies;

    if (searchTerm) {
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (genreFilter && genreFilter !== 'all') {
      filtered = filtered.filter(movie => movie.genre === genreFilter);
    }

    setFilteredMovies(filtered);
  }, [searchTerm, genreFilter, movies]);

  const genres = Array.from(new Set(movies.map(m => m.genre)));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card/60 backdrop-blur-sm border-border"
          />
        </div>
        
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card/60 backdrop-blur-sm border-border">
            <SelectValue placeholder="Filter by genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            userRating={userRatings[movie.id]}
            onRatingChange={fetchUserRatings}
          />
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No movies found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}