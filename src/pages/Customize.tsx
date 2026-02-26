import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Palette, Heart, Send, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const sizes = ["6 inch (serves 8-10)", "8 inch (serves 12-16)", "10 inch (serves 20-24)", "12 inch (serves 30-36)"];
const flavors = ["Vanilla", "Chocolate", "Red Velvet", "Lemon", "Strawberry", "Carrot", "Marble"];
const fillings = ["Buttercream", "Cream Cheese", "Ganache", "Fresh Fruit", "Custard", "Whipped Cream"];
const deliveryMethods = ["Pickup", "Standard Delivery", "Express Delivery"];

const Customize = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [size, setSize] = useState("");
  const [flavor, setFlavor] = useState("");
  const [filling, setFilling] = useState("");
  const [color, setColor] = useState("#E91E63");
  const [delivery, setDelivery] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      setFullName(user.user_metadata?.full_name ?? "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!size || !flavor || !filling || !delivery || !fullName || !email || !phone) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // 1. Save to database
      const { data: order, error: dbError } = await supabase
        .from("custom_orders")
        .insert({
          user_id: user.id,
          full_name: fullName,
          email,
          phone_number: phone,
          size,
          flavor,
          filling,
          color,
          delivery_method: delivery,
          delivery_date: deliveryDate || null,
          notes,
          status: "pending",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Send customer confirmation email via EmailJS (server-side)
      try {
        await supabase.functions.invoke("send-customer-email", {
          body: {
            templateParams: {
              to_email: email,
              customer_name: fullName,
              order_id: order.id,
              cake_size: size,
              cake_flavor: flavor,
              cake_filling: filling,
              delivery_method: delivery,
              delivery_date: deliveryDate || "To be confirmed",
            },
          },
        });
      } catch (emailErr) {
        console.error("EmailJS error:", emailErr);
      }

      // 3. Send admin notification via Web3Forms (server-side edge function)
      try {
        await supabase.functions.invoke("send-admin-notification", {
          body: {
            orderId: order.id,
            fullName,
            email,
            phoneNumber: phone,
            size,
            flavor,
            filling,
            color,
            deliveryMethod: delivery,
            deliveryDate: deliveryDate || "Not specified",
            notes,
          },
        });
      } catch (adminErr) {
        console.error("Admin notification error:", adminErr);
      }

      setShowSuccess(true);
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen">
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center"
              >
                <Heart className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
            <DialogTitle className="text-center font-display text-2xl">
              Thank You for Your Order!
            </DialogTitle>
            <DialogDescription className="text-center font-body text-base mt-2">
              Our customer service team will reach out to you within 2 hours to confirm your cake details.
            </DialogDescription>
          </DialogHeader>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowSuccess(false); navigate("/"); }}
            className="w-full bg-gradient-pink text-primary-foreground py-3 rounded-full font-body font-semibold shadow-pink mt-4"
          >
            Back to Home
          </motion.button>
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <section className="bg-gradient-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Cake className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-surface-dark-foreground mb-4">
              Customize Your <span className="text-gradient-pink">Dream Cake</span>
            </h1>
            <p className="font-body text-surface-dark-foreground/60 max-w-lg mx-auto">
              Design your perfect cake and we'll bring your vision to life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div className="grid lg:grid-cols-2 gap-12">
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* Full Name */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 block">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 block">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 block">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Size */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 block">Size *</label>
                <div className="grid grid-cols-2 gap-3">
                  {sizes.map(s => (
                    <motion.button
                      key={s} type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSize(s)}
                      className={`p-3 rounded-xl border font-body text-sm text-left transition-all ${
                        size === s ? "border-primary bg-accent shadow-pink" : "border-border hover:border-primary/30"
                      }`}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Flavor */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 block">Flavor *</label>
                <div className="flex flex-wrap gap-2">
                  {flavors.map(f => (
                    <motion.button
                      key={f} type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFlavor(f)}
                      className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                        flavor === f ? "bg-gradient-pink text-primary-foreground shadow-pink" : "bg-muted hover:bg-accent"
                      }`}
                    >
                      {f}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Filling */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 block">Filling *</label>
                <div className="flex flex-wrap gap-2">
                  {fillings.map(f => (
                    <motion.button
                      key={f} type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilling(f)}
                      className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                        filling === f ? "bg-gradient-pink text-primary-foreground shadow-pink" : "bg-muted hover:bg-accent"
                      }`}
                    >
                      {f}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" /> Primary Color
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-16 h-16 rounded-xl border border-border cursor-pointer"
                />
              </div>

              {/* Delivery Method */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 block">Delivery Method *</label>
                <div className="space-y-2">
                  {deliveryMethods.map(d => (
                    <motion.button
                      key={d} type="button"
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setDelivery(d)}
                      className={`w-full p-3 rounded-xl border font-body text-sm text-left transition-all ${
                        delivery === d ? "border-primary bg-accent shadow-pink" : "border-border hover:border-primary/30"
                      }`}
                    >
                      {d}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Delivery Date */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Preferred Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-display font-semibold text-lg mb-3 block">Special Design Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your dream cake design..."
                  rows={4}
                  maxLength={1000}
                  className="w-full p-4 rounded-xl border border-border bg-card font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gradient-pink text-primary-foreground py-4 rounded-full font-body font-semibold text-lg shadow-pink hover:shadow-pink-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-5 h-5" /> {submitting ? "Submitting..." : "Submit Custom Order"}
              </motion.button>
            </motion.form>

            {/* Live Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:sticky lg:top-28 h-fit"
            >
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h3 className="font-display text-2xl font-bold mb-6">Order Preview</h3>
                <div className="space-y-4">
                  {[
                    { label: "Name", value: fullName || "Not entered" },
                    { label: "Email", value: email || "Not entered" },
                    { label: "Phone", value: phone || "Not entered" },
                    { label: "Size", value: size || "Not selected" },
                    { label: "Flavor", value: flavor || "Not selected" },
                    { label: "Filling", value: filling || "Not selected" },
                    { label: "Delivery", value: delivery || "Not selected" },
                    { label: "Date", value: deliveryDate || "Not selected" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-border">
                      <span className="font-body text-muted-foreground text-sm">{item.label}</span>
                      <span className="font-body font-medium text-sm">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 py-2 border-b border-border">
                    <span className="font-body text-muted-foreground text-sm">Color</span>
                    <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: color }} />
                  </div>
                  {notes && (
                    <div className="py-2 border-b border-border">
                      <span className="font-body text-muted-foreground text-sm block mb-1">Notes</span>
                      <p className="font-body text-sm">{notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Customize;
