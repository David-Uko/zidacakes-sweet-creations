import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Video, Lock, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CourseContent = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: access, isLoading: accessLoading } = useQuery({
    queryKey: ["course-access", courseId, user?.id],
    enabled: !!user && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_courses")
        .select("payment_status")
        .eq("user_id", user!.id)
        .eq("course_id", courseId!)
        .eq("payment_status", "paid")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const hasAccess = !!access;

  const { data: lessons = [] } = useQuery({
    queryKey: ["course-lessons", courseId],
    enabled: hasAccess,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (courseLoading || accessLoading) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!user) {
    navigate("/auth", { state: { from: `/courses/${courseId}` } });
    return null;
  }

  if (!hasAccess) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-3">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">
            You need to purchase this course to access the content.
          </p>
          <Button onClick={() => navigate("/courses")} className="bg-primary hover:bg-primary/90">
            Browse Courses
          </Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Link
          to="/my-courses"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Courses
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{course?.title}</h1>
          <p className="text-muted-foreground mb-10 max-w-2xl">{course?.description}</p>

          {/* Mentorship Telegram section */}
          {course?.is_mentorship && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-10 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    🎉 You now have access to Private Mentorship!
                  </h3>
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm mb-4">
                    Join our exclusive Telegram community for direct access to mentors, weekly sessions, and personalised feedback.
                  </p>
                  <a
                    href={course?.telegram_link || "https://t.me/+h-g41WJhYHM1NTY0"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Join Telegram Group
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lessons */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold mb-4">Course Lessons</h2>
            {lessons.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">Course content is being prepared. Check back soon!</p>
            ) : (
              lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {lesson.video_url ? (
                          <Video className="w-4 h-4 text-primary" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-primary" />
                        )}
                        <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                      </div>
                      {lesson.content && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{lesson.content}</p>
                      )}
                      {lesson.video_url && (
                        <div className="mt-4 rounded-lg overflow-hidden aspect-video bg-muted">
                          <iframe
                            src={lesson.video_url}
                            className="w-full h-full"
                            allowFullScreen
                            title={lesson.title}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default CourseContent;
