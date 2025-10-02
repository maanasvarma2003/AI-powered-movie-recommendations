import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Film, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CinemaBackground from '@/components/CinemaBackground';
import AuthModal from '@/components/auth/AuthModal';
import RecommendationSection from '@/components/RecommendationSection';
import MovieGrid from '@/components/MovieGrid';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  return (
    <div className="min-h-screen relative">
      <CinemaBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    CineAI
                  </h1>
                  <p className="text-xs text-muted-foreground">AI-Powered Movie Discovery</p>
                </div>
              </div>

              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-border hover:bg-accent/20"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12 space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-6 py-12 animate-fade-in">
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-scale-in">
              Discover Your Next
              <br />
              Favorite Movie
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by advanced AI, get personalized movie recommendations based on your unique taste
            </p>
            {!user && (
              <Button
                onClick={() => setAuthModalOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 py-6"
              >
                Get Started Free
              </Button>
            )}
          </section>

          {/* Recommendations Section */}
          {user && <RecommendationSection />}

          {/* All Movies Section */}
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">All Movies</h2>
              <p className="text-muted-foreground mt-1">Browse our collection and rate what you love</p>
            </div>
            <MovieGrid />
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 backdrop-blur-xl bg-background/30 mt-24">
          <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
            <p>© 2025 CineAI - AI-Powered Movie Recommendations</p>
          </div>
        </footer>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}