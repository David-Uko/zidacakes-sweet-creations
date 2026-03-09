import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, Leaf, Palette, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import heroBg from "@/assets/hero-bg.jpg";
import cupcakeAccent from "@/assets/cupcake-accent.png";
import cakeWedding from "@/assets/cake-wedding.jpg";
import pastries from "@/assets/pastries.jpg";
import desserts from "@/assets/desserts.jpg";

/* Floating particles for hero */
const Particles = () =>
<div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 12 }).map((_, i) =>
  <div
    key={i}
    className="absolute rounded-full bg-primary/20 animate-particle"
    style={{
      width: `${Math.random() * 12 + 4}px`,
      height: `${Math.random() * 12 + 4}px`,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 8 + 6}s`,
      animationDelay: `${Math.random() * 5}s`
    }} />

  )}
  </div>;


const testimonials = [
{ name: "Sarah M.", text: "The most beautiful wedding cake I've ever seen! Every guest was amazed.", rating: 5 },
{ name: "James L.", text: "Ordered a custom birthday cake and it exceeded all expectations. Delicious!", rating: 5 },
{ name: "Emily R.", text: "Their pastries are incredible. Fresh, flavorful, and beautifully presented.", rating: 5 },
{ name: "David K.", text: "Best red velvet cake in the city. We order every weekend now!", rating: 5 }];


const Index = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const bestSellers = products.slice(0, 4);

  const categoryCards = [
  { title: "Cakes", image: cakeWedding, desc: "Elegant cakes for every celebration" },
  { title: "Pastries", image: pastries, desc: "Freshly baked daily with love" },
  { title: "Desserts", image: desserts, desc: "Indulgent treats to satisfy any craving" }];


  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Hero background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
        </div>
        <Particles />

        <div className="container mx-auto px-4 relative z-10 flex items-center min-h-screen pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}>

              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-block bg-primary/20 text-primary-foreground text-sm font-body font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">

                ✨ Premium Bakery Experience
              </motion.span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 text-primary-foreground">
                Deliciously Crafted,{" "}
                <span className="text-gradient-pink">Beautifully Designed</span>
              </h1>
              <p className="font-body text-lg text-primary-foreground/70 mb-8 max-w-lg leading-relaxed">
                At Zidacakes'n'more, we transform your sweetest dreams into edible masterpieces. 
                Every cake tells a story, every bite creates a memory.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-pink text-primary-foreground px-8 py-3.5 rounded-full font-body font-semibold shadow-pink-lg hover:shadow-pink transition-all flex items-center gap-2">

                    Shop Now <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link to="/customize">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-primary-foreground/30 text-primary-foreground px-8 py-3.5 rounded-full font-body font-semibold hover:bg-primary-foreground/10 transition-all backdrop-blur-sm">

                    Customize Your Cake
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hidden lg:flex justify-center">

              






            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">

            <span className="text-primary font-body font-semibold text-sm uppercase tracking-widest">Our Collection</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Featured Categories</h2>
            <p className="text-muted-foreground font-body max-w-xl mx-auto">
              Explore our exquisite range of handcrafted treats made with the finest ingredients
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {categoryCards.map((cat, i) =>
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -10 }}
              className="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer">

                <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="font-display text-3xl font-bold text-primary-foreground mb-2">{cat.title}</h3>
                  <p className="font-body text-primary-foreground/70 text-sm mb-4">{cat.desc}</p>
                  <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 text-primary font-body font-semibold text-sm hover:gap-3 transition-all">

                    Explore <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-24 bg-gradient-pink-soft">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">

            <span className="text-primary font-body font-semibold text-sm uppercase tracking-widest">Most Loved</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Best Sellers</h2>
            <p className="text-muted-foreground font-body max-w-xl mx-auto">
              Discover our most popular creations loved by thousands of happy customers
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product, i) =>
            <ProductCard key={product.id} product={product} index={i} />
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12">

            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-pink text-primary-foreground px-8 py-3.5 rounded-full font-body font-semibold shadow-pink hover:shadow-pink-lg transition-all">

                View All Products
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">

            <span className="text-primary font-body font-semibold text-sm uppercase tracking-widest">Why Us</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">Why Choose Zidacakes</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
            { icon: Truck, title: "Fast Delivery", desc: "Same-day delivery available for orders placed before 2 PM." },
            { icon: Leaf, title: "Fresh Ingredients", desc: "We use only the finest, locally sourced ingredients in every recipe." },
            { icon: Palette, title: "Custom Designs", desc: "Tell us your vision and we'll create a one-of-a-kind masterpiece." }].
            map((item, i) =>
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -5 }}
              className="text-center p-8 rounded-3xl bg-card border border-border hover:shadow-pink transition-all duration-300">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-accent flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-surface-dark text-surface-dark-foreground">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">

            <span className="text-primary font-body font-semibold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">What Our Customers Say</h2>
          </motion.div>

          <div className="max-w-2xl mx-auto text-center relative">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6">

              <div className="flex justify-center gap-1">
                {Array.from({ length: testimonials[testimonialIndex].rating }).map((_, i) =>
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                )}
              </div>
              <p className="font-display text-2xl md:text-3xl italic leading-relaxed">
                "{testimonials[testimonialIndex].text}"
              </p>
              <p className="font-body font-semibold text-primary">{testimonials[testimonialIndex].name}</p>
            </motion.div>

            <div className="flex justify-center gap-4 mt-10">
              <button
                onClick={() => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
                className="w-10 h-10 rounded-full border border-surface-dark-foreground/20 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all">

                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTestimonialIndex((i) => (i + 1) % testimonials.length)}
                className="w-10 h-10 rounded-full border border-surface-dark-foreground/20 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all">

                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-pink relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Particles />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>

            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Order Your Dream Cake Today
            </h2>
            <p className="font-body text-primary-foreground/80 text-lg max-w-xl mx-auto mb-10">
              From birthdays to weddings, let us create the perfect centerpiece for your celebration.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-foreground text-background px-8 py-3.5 rounded-full font-body font-semibold hover:bg-foreground/90 transition-all">

                  Browse Collection
                </motion.button>
              </Link>
              <Link to="/customize">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-primary-foreground text-primary-foreground px-8 py-3.5 rounded-full font-body font-semibold hover:bg-primary-foreground/10 transition-all">

                  Custom Order
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Allergy Notice */}
      <section className="py-8 bg-accent/50 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-start gap-3 max-w-3xl mx-auto text-center sm:text-left">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-1">Allergy Information</h3>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                Our products are made in an environment that handles <strong className="text-foreground">nuts, dairy, eggs, gluten, and soy</strong>. 
                Whilst we take every precaution, we cannot guarantee that any of our products are free from these allergens. 
                If you have a severe allergy, please <Link to="/contact" className="text-primary underline underline-offset-2 hover:text-primary/80">contact us</Link> before ordering.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>);

};

export default Index;