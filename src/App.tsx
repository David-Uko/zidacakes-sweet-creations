import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SupportWidget from "@/components/SupportWidget";
import PageTransition from "@/components/PageTransition";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Customize from "./pages/Customize";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Proposal from "./pages/Proposal";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Admin routes - no Header/Footer */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Public routes with Header/Footer */}
              <Route path="*" element={
                <>
                  <Header />
                  <CartDrawer />
                  <SupportWidget />
                  <Routes>
                    <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
                    <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
                    <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                    <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
                    <Route path="/customize" element={<PageTransition><Customize /></PageTransition>} />
                    <Route path="/about" element={<PageTransition><About /></PageTransition>} />
                    <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                    <Route path="/proposal" element={<PageTransition><Proposal /></PageTransition>} />
                    <Route path="/checkout" element={<PageTransition><ProtectedRoute><Checkout /></ProtectedRoute></PageTransition>} />
                    <Route path="/order-success" element={<PageTransition><ProtectedRoute><OrderSuccess /></ProtectedRoute></PageTransition>} />
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                  </Routes>
                  <Footer />
                </>
              } />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
