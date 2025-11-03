// frontend/src/components/Navbar.jsx - ENHANCED
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Moon,
  Sun,
  User,
  LogOut,
  LayoutDashboard,
  MessageCircle,
  Briefcase,
  Search,
  Settings,
  UserCircle,
  Package,
  ShoppingBag,
} from "lucide-react";
import { logout } from "../utils/auth";
import NotificationBell from "./NotificationBell";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [dark, setDark] = React.useState(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      return true;
    }
    return false;
  });

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    const isDark = html.classList.contains("dark");
    setDark(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-xl flex items-center gap-2"
          data-testid="logo-link"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold text-lg">
            NovaMarket
          </span>
        </Link>

        {/* Main Navigation - Role Based */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {user.role === "buyer" ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/products")}
                  className="flex items-center gap-2"
                >
                  <Package size={18} />
                  <span>Products</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/services")}
                  className="flex items-center gap-2"
                >
                  <Briefcase size={18} />
                  <span>Services</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/cart")}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag size={18} />
                  <span>Cart</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/buyer-dashboard")}
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/buyer-dashboard");
                    // Use setTimeout to ensure navigation completes first
                    setTimeout(() => {
                      // Find and click the service-requests tab
                      const event = new CustomEvent('switchTab', { detail: 'service-requests' });
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                  className="flex items-center gap-2"
                >
                  <Briefcase size={18} />
                  <span>My Service Requests</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/products")}
                  className="flex items-center gap-2"
                >
                  <Package size={18} />
                  <span>Products</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/services")}
                  className="flex items-center gap-2"
                >
                  <Briefcase size={18} />
                  <span>Services</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/seller-dashboard")}
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/seller-dashboard");
                    // Use setTimeout to ensure navigation completes first
                    setTimeout(() => {
                      // Find and click the service-requests tab
                      const event = new CustomEvent('switchTab', { detail: 'service-requests' });
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                  className="flex items-center gap-2"
                >
                  <Briefcase size={18} />
                  <span>Service Requests</span>
                </Button>
              </>
            )}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {/* Messages */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/chat")}
                data-testid="chat-button"
                className="relative"
              >
                <MessageCircle size={20} />
              </Button>

              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    data-testid="user-menu-button"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden md:inline text-sm font-medium">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-purple-600 mt-1 capitalize">
                      {user.role}
                    </p>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        user.role === "seller"
                          ? "/seller-dashboard"
                          : "/buyer-dashboard"
                      )
                    }
                    className="md:hidden"
                  >
                    <LayoutDashboard size={16} className="mr-2" />
                    Dashboard
                  </DropdownMenuItem>

                  {user.role === "seller" && (
                    <DropdownMenuItem
                      onClick={() => navigate("/freelancer/profile")}
                    >
                      <UserCircle size={16} className="mr-2" />
                      Freelancer Profile
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => navigate("/marketplace")}>
                    <Briefcase size={16} className="mr-2" />
                    {user.role === "buyer" ? "Post Project" : "Find Work"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    data-testid="logout-button"
                    className="text-red-600 dark:text-red-400"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                data-testid="login-button"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/register")}
                data-testid="register-button"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Get Started
              </Button>
            </>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            data-testid="darkmode-toggle-button"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
