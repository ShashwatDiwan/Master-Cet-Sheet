import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Sun, Moon, GraduationCap } from "lucide-react";

export function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          {user && (
            <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200" />
          )}
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground hidden sm:inline">
              Master CET Sheet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex items-center justify-center rounded-md w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {/* Auth buttons */}
          {user ? (
            <>
              <span className="text-sm text-muted-foreground mr-1 hidden sm:inline">{user.username}</span>
              <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }} className="text-muted-foreground hover:text-foreground">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/register')}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
