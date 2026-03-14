import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { motion } from "framer-motion";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="ml-[72px] md:ml-[260px] transition-all duration-300 p-6 md:p-8 pt-6"
      >
        <Outlet />
      </motion.main>
    </div>
  );
};

export default AdminLayout;
