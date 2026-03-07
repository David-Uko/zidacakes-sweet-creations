import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

type PageStatus = "loading" | "success" | "error";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const paypalToken = searchParams.get("token");
  const legacyPaypalOrderId = searchParams.get("paypal_order_id");
  const payerId = searchParams.get("PayerID");
  const orderIdFromQuery = searchParams.get("order_id");

  const [status, setStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("Payment confirmation failed.");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = useState("Payment successful");
  const { clearCart } = useCart();

  useEffect(() => {
    let mounted = true;

    const verifyPayment = async () => {
      if (!sessionId && !paypalToken && !legacyPaypalOrderId) {
        navigate("/");
        return;
      }

      try {
        if (paypalToken || legacyPaypalOrderId) {
          const paypalOrderId = paypalToken || legacyPaypalOrderId!;

          const { data, error } = await supabase.functions.invoke("capture-paypal-order", {
            body: {
              paypalOrderId,
              payerId,
              orderId: orderIdFromQuery,
            },
          });

          if (error || !data?.success) {
            throw new Error(data?.error || error?.message || "Unable to capture PayPal payment");
          }

          if (!mounted) return;
          setConfirmedOrderId(data.orderId || orderIdFromQuery || null);
          setPaymentSummary(data.alreadyCaptured ? "PayPal payment already confirmed" : "PayPal payment confirmed");
        } else if (sessionId) {
          const { data: orderData } = await supabase
            .from("orders" as any)
            .select("id,payment_status")
            .eq("stripe_session_id", sessionId)
            .maybeSingle();

          const order = orderData as any;
          if (!mounted) return;
          setConfirmedOrderId(order?.id || null);
          setPaymentSummary(order?.payment_status === "paid" ? "Stripe payment confirmed" : "Stripe payment received");
        }

        clearCart();
        if (mounted) setStatus("success");
      } catch (error: any) {
        if (!mounted) return;
        setErrorMessage(error?.message || "Payment confirmation failed.");
        setStatus("error");
      }
    };

    verifyPayment();
    return () => {
      mounted = false;
    };
  }, [sessionId, paypalToken, legacyPaypalOrderId, payerId, orderIdFromQuery, navigate, clearCart]);

  if (status === "loading") {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-pink">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-3">Payment Verification Error</h1>
          <p className="font-body text-muted-foreground mb-6">{errorMessage}</p>
          <button
            onClick={() => navigate("/checkout")}
            className="w-full bg-gradient-pink text-primary-foreground py-3 rounded-full font-body font-semibold shadow-pink"
          >
            Back to Checkout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center bg-gradient-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-card border border-border rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-pink"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-20 h-20 mx-auto bg-accent rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold mb-4">Thank You for Your Order!</h1>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <span className="text-primary font-semibold font-body">{paymentSummary}</span>
        </div>

        {confirmedOrderId && (
          <p className="font-body text-sm text-muted-foreground mb-3">
            Order ID: <span className="text-foreground font-semibold">{confirmedOrderId}</span>
          </p>
        )}

        <p className="font-body text-muted-foreground mb-8 leading-relaxed">
          Your order has been placed successfully! A confirmation email has been sent to your inbox.
          Our team will reach out within <strong className="text-foreground">2 hours</strong> to confirm your order details.
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
