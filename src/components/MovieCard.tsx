import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    genre: string;
    year: number;
    description: string;
    poster_url: string;
    rating: number;
  };
  userRating?: number;
  onRatingChange?: () => void;
}

export default function MovieCard({ movie, userRating, onRatingChange }: MovieCardProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [currentRating, setCurrentRating] = useState(userRating || 0);
  const [loading, setLoading] = useState(false);

  const handleRating = async (rating: number) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to rate movies');
        return;
      }

      const { error } = await supabase
        .from('user_ratings')
        .upsert({
          user_id: user.id,
          movie_id: movie.id,
          rating: rating,
        });

      if (error) throw error;

      setCurrentRating(rating);
      toast.success(`Rated ${movie.title}: ${rating} stars`);
      onRatingChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to rate movie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="group overflow-hidden bg-card/60 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-scale-in">
      <div className="relative overflow-hidden aspect-[2/3]">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="font-bold text-lg line-clamp-1">{movie.title}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="bg-primary/20 px-2 py-1 rounded">{movie.genre}</span>
          <span>{movie.year}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{movie.description}</p>
        
        <div className="flex items-center gap-1 pt-2">
          <Star className="w-4 h-4 fill-accent text-accent" />
          <span className="text-sm font-semibold">{movie.rating.toFixed(1)}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="w-full space-y-2">
          <p className="text-xs text-muted-foreground">Your rating:</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                disabled={loading}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => handleRating(star)}
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    star <= (hoveredStar || currentRating)
                      ? 'fill-accent text-accent'
                      : 'text-muted-foreground'
                  }`}
                />
              </Button>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}