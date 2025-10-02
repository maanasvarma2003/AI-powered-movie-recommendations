import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MovieCard from './MovieCard';

interface Movie {
  id: string;
  title: string;
  genre: string;
  year: number;
  description: string;
  poster_url: string;
  rating: number;
}

export default function RecommendationSection() {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

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

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to get personalized recommendations');
        return;
      }

      // Get user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('favorite_genres')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase.functions.invoke('get-recommendations', {
        body: {
          userId: user.id,
          genres: prefs?.favorite_genres || [],
          limit: 6,
        },
      });

      if (error) throw error;
      if (data?.recommendations) {
        setRecommendations(data.recommendations);
        toast.success('Got your personalized recommendations!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRatings();
  }, []);

  return (
    <section className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI-Powered Recommendations
          </h2>
          <p className="text-muted-foreground mt-1">Personalized just for you</p>
        </div>
        
        <Button
          onClick={getRecommendations}
          disabled={loading}
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get Recommendations
            </>
          )}
        </Button>
      </div>

      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              userRating={userRatings[movie.id]}
              onRatingChange={fetchUserRatings}
            />
          ))}
        </div>
      )}

      {!loading && recommendations.length === 0 && (
        <div className="text-center py-12 px-4">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary animate-glow" />
          <h3 className="text-xl font-semibold mb-2">Ready for movie magic?</h3>
          <p className="text-muted-foreground">
            Rate a few movies below, then click "Get Recommendations" for AI-powered suggestions!
          </p>
        </div>
      )}
    </section>
  );
}