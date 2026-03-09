import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Clock, Instagram, Facebook, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-form", {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        },
      });

      if (error) throw new Error(error.message || "Failed to send message");

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Failed to send message", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="pt-20 min-h-screen">
      <section className="bg-gradient-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-surface-dark-foreground mb-4">
              Get In <span className="text-gradient-pink">Touch</span>
            </h1>
            <p className="font-body text-surface-dark-foreground/60 max-w-lg mx-auto">
              Have a question or want to place a custom order? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-accent rounded-3xl p-12 text-center"
                >
                  <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-2xl font-bold mb-2">Message Sent!</h3>
                  <p className="font-body text-muted-foreground">
                    We'll get back to you within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="font-body text-sm font-medium mb-2 block">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="font-body text-sm font-medium mb-2 block">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium mb-2 block">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={e => setFormData(d => ({ ...d, subject: e.target.value }))}
                      placeholder="What's this about?"
                      className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium mb-2 block">Message *</label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={e => setFormData(d => ({ ...d, message: e.target.value }))}
                      placeholder="Tell us how we can help..."
                      rows={5}
                      className="w-full p-3 rounded-xl border border-border bg-card font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={sending}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-pink text-primary-foreground py-3.5 rounded-full font-body font-semibold shadow-pink hover:shadow-pink-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Message"}
                  </motion.button>
                </form>
              )}
            </motion.div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                <h3 className="font-display text-xl font-bold">Contact Information</h3>
                {[
                  { icon: MapPin, label: "Visit Us", value: "123 Bakery Lane, Sweet City, SC 12345" },
                  { icon: Phone, label: "Call Us", value: "+1 (555) 123-4567" },
                  { icon: Mail, label: "Email Us", value: "hello@zidacakes.com" },
                ].map(item => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium">{item.label}</p>
                      <p className="font-body text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-3xl p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-xl font-bold">Business Hours</h3>
                </div>
                <ul className="space-y-2 font-body text-sm">
                  <li className="flex justify-between"><span className="text-muted-foreground">Monday - Friday</span><span>8:00 AM - 8:00 PM</span></li>
                  <li className="flex justify-between"><span className="text-muted-foreground">Saturday</span><span>9:00 AM - 9:00 PM</span></li>
                  <li className="flex justify-between"><span className="text-muted-foreground">Sunday</span><span>10:00 AM - 6:00 PM</span></li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-3xl p-8">
                <h3 className="font-display text-xl font-bold mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {[Instagram, Facebook, Twitter].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-muted rounded-3xl h-48 flex items-center justify-center border border-border">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-body text-sm text-muted-foreground">Interactive Map</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
