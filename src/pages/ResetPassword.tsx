import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Cake, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/auth", { replace: true });
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <Cake className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold mb-2">Invalid Reset Link</h1>
          <p className="font-body text-muted-foreground text-sm mb-4">
            This link is invalid or has expired. Please request a new password reset.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="bg-gradient-pink text-primary-foreground px-6 py-2 rounded-full font-body font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-4">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-pink">
          <div className="text-center mb-8">
            <Cake className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="font-display text-2xl font-bold">Set New Password</h1>
            <p className="font-body text-muted-foreground text-sm mt-1">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                required
                minLength={6}
                className="w-full pl-10 p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className="w-full pl-10 p-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-pink text-primary-foreground py-3 rounded-full font-body font-semibold shadow-pink hover:shadow-pink-lg transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </main>
  );
};

export default ResetPassword;
