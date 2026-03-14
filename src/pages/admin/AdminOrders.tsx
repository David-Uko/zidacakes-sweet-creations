import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Download, Eye, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminOrders, updateOrderStatus } from "@/hooks/useAdminDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const AdminOrders = () => {
  const { data: orders = [], isLoading } = useAdminOrders();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const filtered = orders.filter((o: any) => {
    const matchSearch = o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.customer_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPayment = paymentFilter === "all" || o.payment_status === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      toast({ title: "Order updated", description: `Status changed to ${status}` });
    } catch {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  const viewOrderDetails = async (order: any) => {
    setSelectedOrder(order);
    const { data } = await supabase.rpc("admin_get_order_items", { p_order_id: order.id });
    setOrderItems(data || []);
  };

  const exportCSV = () => {
    const headers = ["Customer", "Email", "Total", "Status", "Payment", "Date"];
    const rows = filtered.map((o: any) => [o.customer_name, o.customer_email, o.total, o.status, o.payment_status, new Date(o.created_at).toLocaleDateString("en-GB")]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Order Management</h1>
        <p className="text-muted-foreground mt-1">View and manage all customer orders.</p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Payment</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order: any, i: number) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-accent/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-medium text-foreground">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                  </td>
                  <td className="p-4 font-semibold">£{Number(order.total).toFixed(2)}</td>
                  <td className="p-4">
                    <Select defaultValue={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                      <SelectTrigger className={cn("w-[130px] h-8 text-xs font-medium border-0", statusColor[order.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", order.payment_status === "paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400")}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" onClick={() => viewOrderDetails(order)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium text-foreground">{selectedOrder.customer_name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{selectedOrder.customer_email}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{selectedOrder.customer_phone || "N/A"}</span></div>
                <div><span className="text-muted-foreground">Delivery:</span> <span className="font-medium text-foreground">{selectedOrder.delivery_method}</span></div>
                <div><span className="text-muted-foreground">Total:</span> <span className="font-bold text-foreground">£{Number(selectedOrder.total).toFixed(2)}</span></div>
                <div><span className="text-muted-foreground">Payment:</span> <span className="font-medium">{selectedOrder.payment_method || "N/A"}</span></div>
              </div>
              {selectedOrder.special_requests && (
                <div className="p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground">Notes:</span> {selectedOrder.special_requests}</div>
              )}
              {orderItems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Items</h4>
                  {orderItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between py-2 border-b border-border/50">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span className="font-semibold">£{Number(item.total_price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
