import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, LogIn } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const CartDrawer = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const { user } = useAuth();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Your Cart</h2>
                <span className="text-sm text-muted-foreground">({totalItems})</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <ShoppingBag className="w-16 h-16 opacity-30" />
                  <p className="font-body text-lg">Your cart is empty</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="bg-gradient-pink text-primary-foreground px-6 py-2 rounded-full font-body font-medium text-sm hover:shadow-pink transition-shadow"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="flex gap-4 bg-muted/50 rounded-xl p-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-sm truncate">{item.name}</h3>
                        <p className="text-primary font-body font-semibold mt-1">£{item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-body font-medium text-sm w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="self-start p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-body font-medium">Total</span>
                  <span className="font-display text-2xl font-bold">£{totalPrice.toFixed(2)}</span>
                </div>
                {user ? (
                  <Link
                    to="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="block w-full bg-gradient-pink text-primary-foreground text-center py-3 rounded-full font-body font-semibold hover:shadow-pink-lg transition-shadow"
                  >
                    Checkout
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <p className="text-center font-body text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <LogIn className="w-4 h-4" />
                      Please log in or create an account to place an order.
                    </p>
                    <Link
                      to="/auth"
                      state={{ from: "/checkout" }}
                      onClick={() => setIsCartOpen(false)}
                      className="block w-full bg-gradient-pink text-primary-foreground text-center py-3 rounded-full font-body font-semibold hover:shadow-pink-lg transition-shadow"
                    >
                      Sign In to Checkout
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
