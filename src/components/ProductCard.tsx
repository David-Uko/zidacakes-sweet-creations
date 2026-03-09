import { motion } from "framer-motion";
import { ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="group interactive-lift bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-pink-lg transition-all duration-500 subtle-ring"
    >
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => addToCart(product)}
          className="absolute bottom-4 right-4 bg-gradient-pink text-primary-foreground p-3 rounded-full shadow-pink opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0"
        >
          <ShoppingBag className="w-5 h-5" />
        </motion.button>
      </div>
      <div className="p-5">
        <p className="text-xs font-body font-medium text-primary uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="font-display font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-muted-foreground text-sm font-body line-clamp-2 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-bold">£{product.price.toFixed(2)}</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-body font-medium">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
