import { Search, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { useLocation, useNavigate } from "react-router-dom";

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/contributors':
        return 'Top Contributors';
      case '/profile':
        return 'Profile';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors duration-200" />
          <div className="hidden md:block">
            {location.pathname === '/' ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img src="/assets/Logo.png" alt="logo" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">EbookStore's <span className="text-primary">Master CET Sheet</span></h1>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-white">{getPageTitle()}</h1>
                <p className="text-xs text-zinc-400">EbookStore's Master CET Sheet</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors duration-200">
            <Search className="w-4 h-4" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors duration-200"
            onClick={() => {
              const newTheme = theme === "dark" ? "light" : "dark";
              setTheme(newTheme);
              if (typeof document !== 'undefined') {
                document.documentElement.classList.remove(newTheme === 'dark' ? 'light' : 'dark');
                document.documentElement.classList.add(newTheme);
              }
            }}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User Avatar (clickable) */}
          <button onClick={() => navigate('/profile')} className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200">
            <span className="text-xs font-medium text-white">JD</span>
          </button>
        </div>
      </div>
    </header>
  );
}