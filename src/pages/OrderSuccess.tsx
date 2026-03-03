import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, [sessionId, navigate]);

  if (!show) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center bg-gradient-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-card border border-border rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-pink"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-20 h-20 mx-auto bg-accent rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold mb-4">
          Thank You for Your Order!
        </h1>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <span className="text-primary font-semibold font-body">Payment Successful</span>
        </div>

        <p className="font-body text-muted-foreground mb-8 leading-relaxed">
          Our customer service team will reach out to you within{" "}
          <strong className="text-foreground">2 hours</strong> to confirm your
          cake details. A confirmation email has been sent to your inbox.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/")}
          className="w-full bg-gradient-pink text-primary-foreground py-3 rounded-full font-body font-semibold shadow-pink"
        >
          Back to Home
        </motion.button>
      </motion.div>
    </main>
  );
};

export default OrderSuccess;
