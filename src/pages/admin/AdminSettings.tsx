import { motion } from "framer-motion";
import { Settings, Shield, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminSettings = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin profile and preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-semibold text-foreground">Admin Profile</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Role</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Administrator</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Last Login</span>
              <span className="font-medium text-foreground">{new Date().toLocaleDateString("en-GB")}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-semibold text-foreground">Notifications</h3>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Email notifications are sent to your admin email when:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>A new order is placed</li>
              <li>A payment is completed</li>
              <li>A new user signs up</li>
              <li>A support message requires attention</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSettings;
