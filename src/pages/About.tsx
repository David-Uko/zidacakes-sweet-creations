import { motion } from "framer-motion";
import { Heart, Target, Eye, Sparkles, Award, Users, Leaf } from "lucide-react";
import cupcakeAccent from "@/assets/cupcake-accent.png";

const teamMembers = [
  { name: "Zida Thompson", role: "Founder & Head Baker", initials: "ZT" },
  { name: "Maria Santos", role: "Pastry Chef", initials: "MS" },
  { name: "James Wilson", role: "Cake Designer", initials: "JW" },
  { name: "Aisha Patel", role: "Operations Manager", initials: "AP" },
];

const values = [
  { icon: Award, title: "Quality", desc: "We never compromise on ingredients or craftsmanship." },
  { icon: Sparkles, title: "Creativity", desc: "Every cake is a unique work of edible art." },
  { icon: Users, title: "Customer Satisfaction", desc: "Your happiness is our greatest reward." },
  { icon: Leaf, title: "Fresh Ingredients", desc: "Locally sourced, always fresh, never frozen." },
];

const About = () => {
  return (
    <main className="pt-20 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-dark py-24 relative overflow-hidden">
        <motion.img
          src={cupcakeAccent}
          alt=""
          className="absolute top-10 right-10 w-32 opacity-20"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-surface-dark-foreground mb-6">
              Our <span className="text-gradient-pink">Story</span>
            </h1>
            <p className="font-body text-surface-dark-foreground/60 max-w-2xl mx-auto text-lg leading-relaxed">
              Born from a passion for baking and a love for creating moments of joy,
              Zidacakes'n'more has grown from a home kitchen dream into a beloved bakery brand.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-body font-semibold text-sm uppercase tracking-widest">How It All Began</span>
              <h2 className="font-display text-4xl font-bold mt-3 mb-6">From Kitchen to Beloved Brand</h2>
              <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
                <p>
                  It all started with a simple cupcake recipe and an unshakeable dream. Our founder, Zida,
                  began baking from her family kitchen, sharing treats with friends and neighbors who
                  couldn't get enough.
                </p>
                <p>
                  What started as a weekend hobby quickly became a passion project. Word spread about
                  the extraordinary attention to detail and the incredible flavors. Before long, requests
                  for custom cakes started flooding in.
                </p>
                <p>
                  Today, Zidacakes'n'more stands as a testament to what happens when passion meets
                  dedication. We've served thousands of happy customers, created hundreds of one-of-a-kind
                  cakes, and we're just getting started.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-pink-soft rounded-3xl p-12 text-center"
            >
              <motion.img
                src={cupcakeAccent}
                alt="Cupcake"
                className="w-48 mx-auto drop-shadow-xl mb-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <p className="font-display text-xl italic text-foreground/80">
                "Every cake we create is baked with love, designed with passion, and served with pride."
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-gradient-pink-soft">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-3xl p-10 border border-border"
            >
              <Target className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-display text-2xl font-bold mb-4">Our Mission</h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                To deliver beautifully crafted cakes that turn moments into memories. We believe every
                celebration deserves a centerpiece that's as stunning to look at as it is delicious to taste.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-3xl p-10 border border-border"
            >
              <Eye className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-display text-2xl font-bold mb-4">Our Vision</h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                To become the leading custom cake brand known for creativity and excellence. We aspire
                to redefine what a bakery can be — a place where art meets flavor.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-body font-semibold text-sm uppercase tracking-widest">What We Stand For</span>
            <h2 className="font-display text-4xl font-bold mt-3">Our Values</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-pink transition-all"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-accent flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{v.title}</h3>
                <p className="font-body text-sm text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-surface-dark text-surface-dark-foreground">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-body font-semibold text-sm uppercase tracking-widest">The People Behind The Magic</span>
            <h2 className="font-display text-4xl font-bold mt-3">Meet The Team</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="text-center group"
              >
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-pink flex items-center justify-center mb-5 group-hover:shadow-pink-lg transition-shadow">
                  <span className="font-display text-3xl font-bold text-primary-foreground">{member.initials}</span>
                </div>
                <h3 className="font-display text-lg font-bold">{member.name}</h3>
                <p className="font-body text-sm text-surface-dark-foreground/60">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-pink">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Heart className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Order With Love Today
            </h2>
            <p className="font-body text-primary-foreground/80 max-w-lg mx-auto mb-8">
              Let us be part of your celebration. Every order comes with a sprinkle of love.
            </p>
            <motion.a
              href="/shop"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-foreground text-background px-8 py-3.5 rounded-full font-body font-semibold hover:bg-foreground/90 transition-all"
            >
              Start Your Order
            </motion.a>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default About;
