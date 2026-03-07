import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SupportWidget from "@/components/SupportWidget";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Customize from "./pages/Customize";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Proposal from "./pages/Proposal";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <CartDrawer />
            <SupportWidget />
            <Routes>
              <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
              <Route path="/" element={<PageTransition><ProtectedRoute><Index /></ProtectedRoute></PageTransition>} />
              <Route path="/shop" element={<PageTransition><ProtectedRoute><Shop /></ProtectedRoute></PageTransition>} />
              <Route path="/customize" element={<PageTransition><ProtectedRoute><Customize /></ProtectedRoute></PageTransition>} />
              <Route path="/about" element={<PageTransition><ProtectedRoute><About /></ProtectedRoute></PageTransition>} />
              <Route path="/contact" element={<PageTransition><ProtectedRoute><Contact /></ProtectedRoute></PageTransition>} />
              <Route path="/proposal" element={<PageTransition><ProtectedRoute><Proposal /></ProtectedRoute></PageTransition>} />
              <Route path="/checkout" element={<PageTransition><ProtectedRoute><Checkout /></ProtectedRoute></PageTransition>} />
              <Route path="/order-success" element={<PageTransition><ProtectedRoute><OrderSuccess /></ProtectedRoute></PageTransition>} />
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
