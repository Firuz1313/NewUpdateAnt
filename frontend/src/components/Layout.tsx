import React from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Settings } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
}

export function Layout({
  children,
  showBackButton = false,
  title,
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border backdrop-blur-md"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="text-foreground hover:bg-accent"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Logo size="sm" />
              {title && (
                <div className="hidden md:block">
                  <h1 className="text-xl font-semibold text-foreground text-shadow">
                    {title}
                  </h1>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {location.pathname !== "/" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleHome}
                  className="text-foreground hover:bg-accent"
                >
                  <Home className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="text-foreground hover:bg-accent"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>
    </div>
  );
}

export default Layout;
