import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Palette, Heart, Send } from "lucide-react";

const sizes = ["6 inch (serves 8-10)", "8 inch (serves 12-16)", "10 inch (serves 20-24)", "12 inch (serves 30-36)"];
const flavors = ["Vanilla", "Chocolate", "Red Velvet", "Lemon", "Strawberry", "Carrot", "Marble"];
const fillings = ["Buttercream", "Cream Cheese", "Ganache", "Fresh Fruit", "Custard", "Whipped Cream"];
const deliveryMethods = ["Pickup (Free)", "Standard Delivery ($15)", "Express Delivery ($25)"];

const Customize = () => {
  const [size, setSize] = useState("");
  const [flavor, setFlavor] = useState("");
  const [filling, setFilling] = useState("");
  const [color, setColor] = useState("#E91E63");
  const [delivery, setDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const basePrice = size.includes("6") ? 49.99 : size.includes("8") ? 69.99 : size.includes("10") ? 99.99 : size.includes("12") ? 129.99 : 0;
  const deliveryPrice = delivery.includes("Express") ? 25 : delivery.includes("Standard") ? 15 : 0;
  const total = basePrice + deliveryPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="pt-20 min-h-screen">
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

      <section className="py-16">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg mx-auto text-center py-20"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-20 h-20 mx-auto bg-accent rounded-full flex items-center justify-center mb-6"
                >
                  <Heart className="w-10 h-10 text-primary" />
                </motion.div>
                <h2 className="font-display text-3xl font-bold mb-4">Custom Order Submitted!</h2>
                <p className="font-body text-muted-foreground">
                  We'll review your request and send you a detailed quote at {email}.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" className="grid lg:grid-cols-2 gap-12">
                {/* Form */}
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                >
                  {/* Size */}
                  <div>
                    <label className="font-display font-semibold text-lg mb-3 block">Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      {sizes.map(s => (
                        <motion.button
                          key={s}
                          type="button"
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
                    <label className="font-display font-semibold text-lg mb-3 block">Flavor</label>
                    <div className="flex flex-wrap gap-2">
                      {flavors.map(f => (
                        <motion.button
                          key={f}
                          type="button"
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
                    <label className="font-display font-semibold text-lg mb-3 block">Filling</label>
                    <div className="flex flex-wrap gap-2">
                      {fillings.map(f => (
                        <motion.button
                          key={f}
                          type="button"
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
                    <label className="font-display font-semibold text-lg mb-3 block flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" /> Primary Color
                    </label>
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-16 h-16 rounded-xl border border-border cursor-pointer"
                    />
                  </div>

                  {/* Delivery */}
                  <div>
                    <label className="font-display font-semibold text-lg mb-3 block">Delivery Method</label>
                    <div className="space-y-2">
                      {deliveryMethods.map(d => (
                        <motion.button
                          key={d}
                          type="button"
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

                  {/* Notes */}
                  <div>
                    <label className="font-display font-semibold text-lg mb-3 block">Special Design Notes</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Describe your dream cake design..."
                      rows={4}
                      className="w-full p-4 rounded-xl border border-border bg-card font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="font-display font-semibold text-lg mb-3 block">Your Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-pink text-primary-foreground py-4 rounded-full font-body font-semibold text-lg shadow-pink hover:shadow-pink-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" /> Submit Custom Order
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
                        { label: "Size", value: size || "Not selected" },
                        { label: "Flavor", value: flavor || "Not selected" },
                        { label: "Filling", value: filling || "Not selected" },
                        { label: "Delivery", value: delivery || "Not selected" },
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
                    <div className="mt-8 pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-body font-medium">Estimated Total</span>
                        <span className="font-display text-3xl font-bold text-primary">
                          {total > 0 ? `$${total.toFixed(2)}` : "—"}
                        </span>
                      </div>
                      <p className="font-body text-xs text-muted-foreground mt-2">
                        Final price may vary based on design complexity
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
};

export default Customize;
