import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
  HelpCircle,
  Command,
  GraduationCap,
  Trophy,
  TrendingUp
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { NavLink, useLocation } from "react-router-dom";
import logo from '@/assets/Logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard
  },
  {
    title: "Top Contributors",
    url: "/contributors",
    icon: Trophy
  },
];

const supportItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [logoutOpen, setLogoutOpen] = useState(false);
  const handleConfirmLogout = () => {
    setLogoutOpen(false);
    logout();
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    const active = isActive(path);
    return active
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground";
  };

  return (
    <Sidebar
      className={`transition-all duration-300 bg-card border-r border-border ${collapsed ? "w-16" : "w-60"}`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border bg-card">
        <div className="flex justify-center items-center gap-3 px-3 py-4">
          {!collapsed && (
            <div>
              <img src={logo} alt="EbookStore logo" className="w-28 h-28 object-contain dark:brightness-100 brightness-0" />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 bg-card">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider px-3 mb-2">
            {!collapsed && "Main Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={`${getNavClasses(item.url)} transition-all duration-200 rounded-lg px-3 py-2 flex items-center gap-3`}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider px-3 mb-2">
            {!collapsed && "Account"}
          </SidebarGroupLabel>
            <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`${getNavClasses(item.url)} transition-all duration-200 rounded-lg px-3 py-2 flex items-center gap-3`}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* login/logout button with confirmation dialog */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  {user ? (
                    <button
                      onClick={() => setLogoutOpen(true)}
                      className="w-full text-left text-muted-foreground hover:text-foreground transition-colors flex items-center gap-3 px-3 py-2"
                    >
                      <Settings className="w-5 h-5" />
                      {!collapsed && <span className="font-medium">Logout</span>}
                    </button>
                  ) : (
                    <NavLink
                      to="/login"
                      className={`${getNavClasses('/login')} transition-all duration-200 rounded-lg px-3 py-2 flex items-center gap-3`}
                    >
                      <User className="w-5 h-5" />
                      {!collapsed && <span className="font-medium">Login</span>}
                    </NavLink>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Dialog placed outside menu to avoid breaking menu markup */}
            {user && (
              <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Logout</DialogTitle>
                    <DialogDescription>Are you sure you want to log out? You will need to sign in again to access your data.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <div className="flex gap-2">
                      <button onClick={() => setLogoutOpen(false)} className="px-4 py-2 rounded bg-muted text-muted-foreground hover:bg-muted/80">Cancel</button>
                      <button onClick={handleConfirmLogout} className="px-4 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90">Logout</button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border bg-card">
        <div className="p-3 flex items-center justify-between">
          {!collapsed ? (
            <>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">EbookStore's Master CET Sheet</p>
                <p className="text-[10px] text-muted-foreground">v1.0.0</p>
              </div>
              <ThemeToggle />
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ThemeToggle />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
