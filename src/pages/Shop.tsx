import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { products, categories, subcategories } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory;
      const matchSub = activeSubcategory === "All" || p.subcategory === activeSubcategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSub && matchSearch;
    });
  }, [activeCategory, activeSubcategory, search]);

  const currentSubcategories = activeCategory !== "All" ? subcategories[activeCategory] || [] : [];

  return (
    <main className="pt-20 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-surface-dark-foreground mb-4">
              Our <span className="text-gradient-pink">Collection</span>
            </h1>
            <p className="font-body text-surface-dark-foreground/60 max-w-lg mx-auto">
              Explore our handcrafted cakes, pastries, and desserts — each made with love.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-10 relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </motion.div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {categories.map(cat => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveCategory(cat); setActiveSubcategory("All"); }}
                className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-gradient-pink text-primary-foreground shadow-pink"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Subcategories */}
          {currentSubcategories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {currentSubcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-4 py-1.5 rounded-full font-body text-xs font-medium transition-all ${
                    activeSubcategory === sub
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <p className="font-display text-2xl text-muted-foreground">No products found</p>
              <p className="font-body text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Shop;
