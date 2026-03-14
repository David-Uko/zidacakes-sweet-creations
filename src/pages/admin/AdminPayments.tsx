import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AdminPayments = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-payment-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_all_orders");
      if (error) throw error;
      return (data as any[]).filter((o: any) => o.payment_status === "paid");
    },
  });

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">Track all successful payments.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 flex items-center gap-4">
        <div className="p-4 rounded-xl bg-emerald-500/10">
          <CreditCard className="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Revenue Collected</p>
          <p className="text-3xl font-bold font-display text-foreground">£{totalRevenue.toFixed(2)}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any, i: number) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-foreground">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                  </td>
                  <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">£{Number(order.total).toFixed(2)}</td>
                  <td className="p-4 text-muted-foreground capitalize">{order.payment_method || "—"}</td>
                  <td className="p-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-GB")}</td>
                </motion.tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No payments recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPayments;
