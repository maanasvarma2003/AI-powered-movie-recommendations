import { Link } from "react-router-dom";
import { Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Film className="w-16 h-16 mx-auto text-primary animate-glow" />
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <Link to="/" className="inline-block mt-4 text-primary hover:text-accent transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
