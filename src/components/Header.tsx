import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/customize", label: "Customize" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl md:text-2xl font-bold tracking-tight">
            Zida<span className="text-primary">cakes</span>'n'more
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-body text-sm font-medium transition-colors hover:text-primary relative ${
                location.pathname === link.to ? "text-primary" : "text-foreground/70"
              }`}
            >
              {link.label}
              {location.pathname === link.to && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-pink rounded-full"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-accent transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-pink text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center"
              >
                {totalItems}
              </motion.span>
            )}
          </button>

          <button className="hidden md:flex p-2 rounded-full hover:bg-accent transition-colors">
            <User className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-full hover:bg-accent transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-background border-b border-border"
          >
            <nav className="flex flex-col px-4 py-4 gap-3">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`font-body text-base font-medium py-2 px-3 rounded-lg transition-colors ${
                    location.pathname === link.to
                      ? "bg-accent text-primary"
                      : "text-foreground/70 hover:bg-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
