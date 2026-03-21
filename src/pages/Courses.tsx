import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, Star, ChevronRight, GraduationCap, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const categoryIcons: Record<string, React.ReactNode> = {
  baking: <BookOpen className="w-5 h-5" />,
  pastry: <Star className="w-5 h-5" />,
  design: <Sparkles className="w-5 h-5" />,
  mentorship: <Users className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  baking: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  pastry: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  design: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  mentorship: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .order("is_mentorship", { ascending: true })
        .order("price", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: userCourses = [] } = useQuery({
    queryKey: ["user-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_courses")
        .select("course_id, payment_status")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const purchasedCourseIds = new Set(
    userCourses.filter((uc) => uc.payment_status === "paid").map((uc) => uc.course_id)
  );

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      navigate("/auth", { state: { from: "/courses" } });
      return;
    }

    if (purchasedCourseIds.has(courseId)) {
      navigate(`/courses/${courseId}`);
      return;
    }

    setEnrollingId(courseId);
    try {
      const { data, error } = await supabase.functions.invoke("create-course-checkout", {
        body: { courseId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Failed to start checkout. Please try again.");
      console.error(err);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <main className="pt-20 min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
              <GraduationCap className="w-4 h-4 mr-1.5" /> Professional Training
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Master the Art of{" "}
              <span className="text-primary">Cake Making</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn from expert bakers with our professional courses and private mentorship programmes. Transform your passion into a skill.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => {
                const isPurchased = purchasedCourseIds.has(course.id);
                const learningPoints = (course.learning_points as string[]) || [];

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`group relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col ${
                      course.is_mentorship ? "md:col-span-2 lg:col-span-3" : ""
                    }`}
                  >
                    {/* Gradient accent bar */}
                    <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-accent" />

                    <div className={`p-6 md:p-8 flex flex-col flex-1 ${course.is_mentorship ? "md:flex-row md:gap-10" : ""}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[course.category] || categoryColors.baking}`}>
                            {categoryIcons[course.category] || categoryIcons.baking}
                            {course.category.charAt(0).toUpperCase() + course.category.slice(1)}
                          </span>
                          {course.duration && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {course.duration}
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base mb-5 leading-relaxed">
                          {course.description}
                        </p>

                        {learningPoints.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold mb-2 text-foreground/80">What you'll learn:</h4>
                            <ul className="space-y-1.5">
                              {learningPoints.slice(0, 5).map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className={`flex items-end justify-between gap-4 ${course.is_mentorship ? "md:flex-col md:items-end md:justify-center md:min-w-[220px]" : ""}`}>
                        <div>
                          <span className="text-3xl md:text-4xl font-display font-bold text-foreground">
                            £{Number(course.price).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingId === course.id}
                          className={`min-w-[160px] font-semibold ${
                            isPurchased
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-primary hover:bg-primary/90"
                          }`}
                        >
                          {enrollingId === course.id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : isPurchased ? (
                            "Access Course"
                          ) : (
                            "Enrol Now"
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Courses;
