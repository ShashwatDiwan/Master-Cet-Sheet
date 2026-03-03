import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // do not render header when user is logged in (sidebar handles navigation)
  if (user) {
    return null;
  }

  const getPageTitle = () => {
    // for unauthenticated users we just always show dashboard text
    return 'Dashboard';
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors duration-200" />
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            {/* auth buttons */}
            {user ? (
              <>
                <span className="text-sm mr-2">{user.username}</span>
                <Button variant="default" size="sm" onClick={() => { logout(); navigate('/'); }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="default" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
