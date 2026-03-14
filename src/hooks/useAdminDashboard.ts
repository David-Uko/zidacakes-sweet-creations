import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  total_members: number;
  total_custom_orders: number;
  monthly_orders: { month: string; count: number; revenue: number }[] | null;
  recent_orders: {
    id: string;
    customer_name: string;
    customer_email: string;
    total: number;
    status: string;
    payment_status: string;
    created_at: string;
  }[] | null;
}

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_dashboard_stats");
      if (error) throw error;
      return data as unknown as DashboardStats;
    },
    refetchInterval: 30000,
  });
};

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_all_orders");
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 15000,
  });
};

export const useAdminProfiles = () => {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_all_profiles");
      if (error) throw error;
      return data as any[];
    },
  });
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const { error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw error;
};
