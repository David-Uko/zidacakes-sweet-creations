import { motion } from "framer-motion";
import { ShoppingBag, Minus, Plus, X, ArrowLeft, CreditCard, ExternalLink } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled") === "true") {
      toast({ title: "Payment canceled", description: "You can try again when ready." });
    }
  }, [toast]);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-cart-checkout", {
        body: {
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          customerEmail: user?.email || undefined,
        },
      });

      if (error) throw new Error(error.message || "Checkout failed");
      if (!data?.url) throw new Error("No checkout URL returned");

      // Store URL and try to redirect
      setStripeUrl(data.url);
      window.location.href = data.url;

      // Reset after delay in case redirect is blocked (iframe/preview)
      setTimeout(() => setProcessing(false), 3000);
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto" />
          <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
          <p className="font-body text-muted-foreground">Add some treats to get started!</p>
          <Link
            to="/shop"
            className="inline-block bg-gradient-pink text-primary-foreground px-8 py-3 rounded-full font-body font-semibold hover:shadow-pink transition-shadow"
          >
            Browse Shop
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen">
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/shop" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex gap-4 bg-card border border-border rounded-2xl p-4"
                >
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold truncate">{item.name}</h3>
                    <p className="text-primary font-body font-semibold mt-1">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-body font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <span className="font-display font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-28 space-y-6">
                <h2 className="font-display text-xl font-bold">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Items ({totalItems})</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-primary font-medium">Free</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-display font-bold text-lg">Total</span>
                    <span className="font-display font-bold text-lg">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {stripeUrl ? (
                  <a
                    href={stripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-pink text-primary-foreground py-4 rounded-full font-body font-semibold text-lg shadow-pink hover:shadow-pink-lg transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open Stripe Payment
                  </a>
                ) : (
                  <motion.button
                    onClick={handleCheckout}
                    disabled={processing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-pink text-primary-foreground py-4 rounded-full font-body font-semibold text-lg shadow-pink hover:shadow-pink-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CreditCard className="w-5 h-5" />
                    {processing ? "Processing..." : "Pay Now"}
                  </motion.button>
                )}

                <p className="font-body text-xs text-muted-foreground text-center">
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Checkout;
