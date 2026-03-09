import { motion } from "framer-motion";
import {
  ShoppingBag, Minus, Plus, X, ArrowLeft, CreditCard, ExternalLink,
  MapPin, Clock, CalendarDays, Package, Truck, MessageSquare
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const SHIPPING_COST = 5.99;

const Checkout = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");

  // Delivery fields
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "postage">("pickup");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cakeSize, setCakeSize] = useState("");

  const shippingCost = deliveryMethod === "postage" ? SHIPPING_COST : 0;
  const orderTotal = totalPrice + shippingCost;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled") === "true") {
      toast({ title: "Payment canceled", description: "You can try again when ready." });
    }
  }, [toast]);

  // Pre-fill from user profile
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setCustomerName(user.user_metadata.full_name);
    }
  }, [user]);

  const validateForm = () => {
    if (!customerName.trim()) { toast({ title: "Name required", variant: "destructive" }); return false; }
    if (!deliveryDate) { toast({ title: "Delivery date required", variant: "destructive" }); return false; }
    if (!deliveryTime) { toast({ title: "Delivery time required", variant: "destructive" }); return false; }
    if (deliveryMethod === "postage" && !address.trim()) {
      toast({ title: "Address required for postage delivery", variant: "destructive" }); return false;
    }
    return true;
  };

  const saveOrder = async (paymentMethodUsed: string) => {
    const fullAddress = deliveryMethod === "postage"
      ? [address, city, postalCode].filter(Boolean).join(", ")
      : "Pickup";

    const { data: order, error: orderError } = await supabase
      .from("orders" as any)
      .insert({
        user_id: user!.id,
        customer_name: customerName.trim(),
        customer_email: user!.email!,
        customer_phone: customerPhone.trim() || null,
        delivery_method: deliveryMethod,
        delivery_date: deliveryDate || null,
        delivery_time: deliveryTime || null,
        delivery_address: fullAddress,
        special_requests: [cakeSize ? `Cake Size: ${cakeSize}` : "", specialRequests.trim()].filter(Boolean).join(" | ") || null,
        payment_method: paymentMethodUsed,
        subtotal: totalPrice,
        shipping_cost: shippingCost,
        total: orderTotal,
      } as any)
      .select()
      .single();

    if (orderError || !order) throw new Error("Failed to create order");

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: (order as any).id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    await supabase.from("order_items" as any).insert(orderItems as any);

    return order as any;
  };

  const handleStripeCheckout = async () => {
    if (items.length === 0 || !validateForm()) return;
    setProcessing(true);

    try {
      const order = await saveOrder("stripe");

      const { data, error } = await supabase.functions.invoke("create-cart-checkout", {
        body: {
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          customerEmail: user?.email || undefined,
          orderId: order.id,
          shippingCost: deliveryMethod === "postage" ? Math.round(SHIPPING_COST * 100) : 0,
        },
      });

      if (error) throw new Error(error.message || "Checkout failed");
      if (!data?.url) throw new Error("No checkout URL returned");

      // Update order with stripe session id
      await supabase.from("orders" as any).update({ stripe_session_id: data.sessionId } as any).eq("id", order.id);

      setStripeUrl(data.url);
      window.location.href = data.url;
      setTimeout(() => setProcessing(false), 3000);
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setProcessing(false);
    }
  };

  const handlePayPalCheckout = async () => {
    if (items.length === 0 || !validateForm()) return;
    setProcessing(true);

    try {
      const order = await saveOrder("paypal");

      const { data, error } = await supabase.functions.invoke("create-paypal-order", {
        body: {
          orderId: order.id,
          items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
          total: orderTotal,
          shippingCost,
        },
      });

      if (error) throw new Error(error.message || "PayPal checkout failed");
      if (!data?.approvalUrl || !data?.paypalOrderId) throw new Error("No PayPal approval URL returned");

      await supabase
        .from("orders" as any)
        .update({ paypal_order_id: data.paypalOrderId } as any)
        .eq("id", order.id);

      setStripeUrl(data.approvalUrl);
      window.location.href = data.approvalUrl;
      setTimeout(() => setProcessing(false), 3000);
    } catch (err: any) {
      toast({ title: "PayPal checkout failed", description: err.message, variant: "destructive" });
      setProcessing(false);
    }
  };

  const handleCheckout = () => {
    if (paymentMethod === "stripe") handleStripeCheckout();
    else handlePayPalCheckout();
  };

  if (items.length === 0) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
          <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto" />
          <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
          <p className="font-body text-muted-foreground">Add some treats to get started!</p>
          <Link to="/shop" className="inline-block bg-gradient-pink text-primary-foreground px-8 py-3 rounded-full font-body font-semibold hover:shadow-pink transition-shadow">
            Browse Shop
          </Link>
        </motion.div>
      </main>
    );
  }

  // Minimum delivery date is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <main className="pt-20 min-h-screen">
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/shop" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column: Items + Delivery + Payment */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cart Items */}
              <div>
                <h2 className="font-display text-xl font-bold mb-4">Your Items ({totalItems})</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <motion.div key={item.id} layout className="flex gap-4 bg-card border border-border rounded-2xl p-4">
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold truncate text-sm">{item.name}</h3>
                        <p className="text-primary font-body font-semibold text-sm mt-1">${item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-body font-medium w-6 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button onClick={() => removeFromCart(item.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                        <span className="font-display font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Customer & Delivery Details
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 block">Full Name *</label>
                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your full name"
                      className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 block">Phone Number</label>
                    <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number"
                      className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>

                {/* Cake Size */}
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Cake Size</label>
                  <select value={cakeSize} onChange={(e) => setCakeSize(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select size (optional)</option>
                    <option value="6 inch (serves 8-10)">6 inch (serves 8-10)</option>
                    <option value="8 inch (serves 12-16)">8 inch (serves 12-16)</option>
                    <option value="10 inch (serves 20-24)">10 inch (serves 20-24)</option>
                    <option value="12 inch (serves 30-36)">12 inch (serves 30-36)</option>
                    <option value="Cupcakes">Cupcakes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Delivery Method */}
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-2 block">Delivery Method *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setDeliveryMethod("pickup")}
                      className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${deliveryMethod === "pickup" ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
                      <Package className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-body font-semibold text-sm">Pickup</div>
                        <div className="font-body text-xs text-muted-foreground">Collect from store</div>
                      </div>
                    </button>
                    <button onClick={() => setDeliveryMethod("postage")}
                      className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${deliveryMethod === "postage" ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
                      <Truck className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-body font-semibold text-sm">Postage</div>
                        <div className="font-body text-xs text-muted-foreground">+ ${SHIPPING_COST.toFixed(2)}</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" /> Date *
                    </label>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={minDateStr}
                      className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Time *
                    </label>
                    <select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Select time</option>
                      <option value="09:00 - 10:00">09:00 - 10:00</option>
                      <option value="10:00 - 11:00">10:00 - 11:00</option>
                      <option value="11:00 - 12:00">11:00 - 12:00</option>
                      <option value="12:00 - 13:00">12:00 - 13:00</option>
                      <option value="13:00 - 14:00">13:00 - 14:00</option>
                      <option value="14:00 - 15:00">14:00 - 15:00</option>
                      <option value="15:00 - 16:00">15:00 - 16:00</option>
                      <option value="16:00 - 17:00">16:00 - 17:00</option>
                    </select>
                  </div>
                </div>

                {/* Address (only for postage) */}
                {deliveryMethod === "postage" && (
                  <div className="space-y-4">
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-1 block">Street Address *</label>
                      <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address"
                        className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-sm text-muted-foreground mb-1 block">City</label>
                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City"
                          className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div>
                        <label className="font-body text-sm text-muted-foreground mb-1 block">Postal Code</label>
                        <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal code"
                          className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" /> Special Requests
                  </label>
                  <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3}
                    placeholder="Any special instructions for your order..."
                    className="w-full p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Payment Method
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPaymentMethod("stripe")}
                    className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === "stripe" ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-body font-semibold text-sm">Credit / Debit Card</div>
                      <div className="font-body text-xs text-muted-foreground">Powered by Stripe</div>
                    </div>
                  </button>
                  <button onClick={() => setPaymentMethod("paypal")}
                    className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === "paypal" ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
                    <span className="text-lg font-bold text-primary">P</span>
                    <div className="text-left">
                      <div className="font-body font-semibold text-sm">PayPal</div>
                      <div className="font-body text-xs text-muted-foreground">Pay with PayPal</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right column: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-28 space-y-6">
                <h2 className="font-display text-xl font-bold">Order Summary</h2>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground truncate mr-2">{item.name} × {item.quantity}</span>
                      <span className="shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost === 0 ? <span className="text-primary font-medium">Free (Pickup)</span> : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-display font-bold text-lg">Total</span>
                    <span className="font-display font-bold text-lg">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                {stripeUrl ? (
                  <a href={stripeUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full bg-gradient-pink text-primary-foreground py-4 rounded-full font-body font-semibold text-lg shadow-pink hover:shadow-pink-lg transition-all flex items-center justify-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Open Payment Page
                  </a>
                ) : (
                  <motion.button onClick={handleCheckout} disabled={processing}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-pink text-primary-foreground py-4 rounded-full font-body font-semibold text-lg shadow-pink hover:shadow-pink-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {paymentMethod === "stripe" ? <CreditCard className="w-5 h-5" /> : <span className="font-bold">P</span>}
                    {processing ? "Processing..." : `Pay $${orderTotal.toFixed(2)}`}
                  </motion.button>
                )}

                <p className="font-body text-xs text-muted-foreground text-center">
                  Secure payment powered by {paymentMethod === "stripe" ? "Stripe" : "PayPal"}
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
