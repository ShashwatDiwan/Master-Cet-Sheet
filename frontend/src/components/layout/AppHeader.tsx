import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
    <header className="h-16 border-b border-zinc-700 bg-zinc-800 sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors duration-200" />
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* auth buttons */}
          {user ? (
            <>
              <span className="text-sm text-white mr-2">{user.username}</span>
              <Button variant="solid" size="sm" onClick={() => { logout(); navigate('/'); }}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="solid" size="sm" onClick={() => navigate('/login')}>
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