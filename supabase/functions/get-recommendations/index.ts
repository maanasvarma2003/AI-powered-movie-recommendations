import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, genres, limit = 5 } = await req.json();
    console.log('Generating recommendations for user:', userId, 'genres:', genres);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's rating history
    const { data: userRatings } = await supabase
      .from('user_ratings')
      .select('movie_id, rating, movies(title, genre)')
      .eq('user_id', userId)
      .order('rating', { ascending: false })
      .limit(10);

    // Get all movies
    const { data: allMovies } = await supabase
      .from('movies')
      .select('*')
      .order('rating', { ascending: false });

    // Prepare context for AI
    const ratedMovies = userRatings?.map(r => {
      const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies;
      return `${movie?.title} (${movie?.genre}) - Rating: ${r.rating}/5`;
    }).join('\n') || 'No ratings yet';

    const availableMovies = allMovies?.map(m =>
      `${m.title} (${m.genre}, ${m.year}) - ${m.description}`
    ).join('\n') || '';

    const ratedMovieIds = new Set(userRatings?.map(r => r.movie_id) || []);

    // Use AI to generate personalized recommendations
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert movie recommendation engine. Analyze user preferences and suggest movies they'll love. Be concise and only return movie titles from the available list.`
          },
          {
            role: 'user',
            content: `User's rated movies:\n${ratedMovies}\n\nFavorite genres: ${genres?.join(', ') || 'Not specified'}\n\nAvailable movies:\n${availableMovies}\n\nRecommend ${limit} movies from the available list that this user would enjoy. Return ONLY the exact movie titles, one per line.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to get AI recommendations');
    }

    const aiData = await aiResponse.json();
    const recommendedTitles = aiData.choices[0].message.content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    console.log('AI recommended titles:', recommendedTitles);

    // Match AI recommendations with actual movies and filter out already rated
    const recommendations = allMovies
      ?.filter(movie => 
        !ratedMovieIds.has(movie.id) &&
        recommendedTitles.some((title: string) => 
          movie.title.toLowerCase().includes(title.toLowerCase()) ||
          title.toLowerCase().includes(movie.title.toLowerCase())
        )
      )
      .slice(0, limit) || [];

    // If AI recommendations don't match enough movies, fallback to genre-based
    if (recommendations.length < limit) {
      console.log('Falling back to genre-based recommendations');
      const genreMovies = allMovies
        ?.filter(movie => 
          !ratedMovieIds.has(movie.id) &&
          !recommendations.find(r => r.id === movie.id) &&
          (genres?.some((g: string) => movie.genre.toLowerCase().includes(g.toLowerCase())) || true)
        )
        .slice(0, limit - recommendations.length) || [];
      
      recommendations.push(...genreMovies);
    }

    console.log('Final recommendations:', recommendations.length);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-recommendations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});