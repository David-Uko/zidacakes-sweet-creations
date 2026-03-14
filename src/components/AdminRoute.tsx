import { Navigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading, user } = useAdminCheck();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground animate-pulse">Verifying access...</p>
        </div>
      </main>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default AdminRoute;
