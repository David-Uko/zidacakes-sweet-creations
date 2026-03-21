import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, GraduationCap, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const MyCourses = () => {
  const { user } = useAuth();

  const { data: purchasedCourses = [], isLoading } = useQuery({
    queryKey: ["my-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: userCourses, error: ucError } = await supabase
        .from("user_courses")
        .select("course_id, payment_status, purchased_at")
        .eq("user_id", user!.id)
        .eq("payment_status", "paid");
      if (ucError) throw ucError;
      if (!userCourses.length) return [];

      const courseIds = userCourses.map((uc) => uc.course_id);
      const { data: courses, error: cError } = await supabase
        .from("courses")
        .select("*")
        .in("id", courseIds);
      if (cError) throw cError;

      return (courses || []).map((course) => ({
        ...course,
        purchased_at: userCourses.find((uc) => uc.course_id === course.id)?.purchased_at,
      }));
    },
  });

  return (
    <main className="pt-20 min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">My Courses</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : purchasedCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">No courses yet</h2>
              <p className="text-muted-foreground mb-6">Browse our courses and start your learning journey.</p>
              <Link to="/courses">
                <Button className="bg-primary hover:bg-primary/90">Browse Courses</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/courses/${course.id}`}
                    className="block group rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Purchased
                      </Badge>
                      <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-primary font-medium">
                      Continue Learning <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
};

export default MyCourses;
