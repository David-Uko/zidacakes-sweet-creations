import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, ChevronRight, GraduationCap, Users, Sparkles, Crown, Video, MessageCircle, Shield, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ courseId: string; title: string } | null>(null);

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

  const handleEnroll = (courseId: string, courseTitle: string) => {
    if (!user) {
      navigate("/auth", { state: { from: "/courses" } });
      return;
    }

    if (purchasedCourseIds.has(courseId)) {
      navigate(`/courses/${courseId}`);
      return;
    }

    setPaymentModal({ courseId, title: courseTitle });
  };

  const handleStripePayment = async (courseId: string) => {
    setPaymentModal(null);
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

  const handlePayPalPayment = async (courseId: string) => {
    setPaymentModal(null);
    setEnrollingId(courseId);
    try {
      const { data, error } = await supabase.functions.invoke("create-course-paypal-order", {
        body: { courseId },
      });
      if (error) throw error;
      if (data?.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (err: any) {
      toast.error("Failed to start PayPal checkout. Please try again.");
      console.error(err);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <main className="pt-20 min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/5" />
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-5 py-2 text-sm font-medium">
                <GraduationCap className="w-4 h-4 mr-2" /> Professional Training
              </Badge>
            </motion.div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              SMBC{" "}
              <span className="text-primary relative">
                Online Class
                <motion.span
                  className="absolute -bottom-2 left-0 w-full h-1 bg-primary/30 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Master Swiss Meringue Buttercream with our expert-led courses. Choose your path — self-paced video lessons or exclusive private mentorship.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-sm text-muted-foreground">
            {[
              { icon: <Video className="w-4 h-4" />, text: "HD Video Lessons" },
              { icon: <Shield className="w-4 h-4" />, text: "Secure Payment" },
              { icon: <MessageCircle className="w-4 h-4" />, text: "Expert Support" },
              { icon: <Clock className="w-4 h-4" />, text: "Lifetime Access" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2"
              >
                <span className="text-primary">{feature.icon}</span>
                {feature.text}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {courses.map((course, index) => {
                const isPurchased = purchasedCourseIds.has(course.id);
                const learningPoints = (course.learning_points as string[]) || [];
                const isMentorship = course.is_mentorship;

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className={`group relative rounded-3xl overflow-hidden flex flex-col ${
                      isMentorship
                        ? "bg-gradient-to-br from-primary/5 via-card to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/5"
                        : "bg-card border border-border shadow-sm"
                    }`}
                  >
                    {/* Premium badge for mentorship */}
                    {isMentorship && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-4 right-4 z-10"
                      >
                        <Badge className="bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold shadow-lg">
                          <Crown className="w-3.5 h-3.5 mr-1" /> PREMIUM
                        </Badge>
                      </motion.div>
                    )}

                    {/* Gradient top bar */}
                    <div className={`h-2 ${isMentorship ? "bg-gradient-to-r from-primary via-primary/80 to-accent" : "bg-gradient-to-r from-primary/60 to-primary/30"}`} />

                    {/* Course image placeholder — replace with your own */}
                    <div className={`relative h-48 md:h-56 overflow-hidden ${isMentorship ? "bg-gradient-to-br from-primary/20 to-primary/5" : "bg-gradient-to-br from-muted to-muted/50"}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                            isMentorship ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary/70"
                          }`}
                        >
                          {isMentorship ? <Users className="w-10 h-10" /> : <BookOpen className="w-10 h-10" />}
                        </motion.div>
                      </div>
                      {/* To add your own image: replace this div with <img src="/your-image.jpg" className="w-full h-full object-cover" /> */}
                    </div>

                    <div className="p-6 md:p-8 flex flex-col flex-1">
                      {/* Category & Duration */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          isMentorship
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {isMentorship ? <Users className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {isMentorship ? "Mentorship" : "Course"}
                        </span>
                        {course.duration && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {course.duration}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm md:text-base mb-5 leading-relaxed flex-1">
                        {course.description}
                      </p>

                      {/* Learning Points */}
                      {learningPoints.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold mb-3 text-foreground/80">What's included:</h4>
                          <ul className="space-y-2">
                            {learningPoints.map((point, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                {point}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Mentorship highlight */}
                      {isMentorship && (
                        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <MessageCircle className="w-4 h-4" />
                            Private Telegram Group Access Included
                          </div>
                        </div>
                      )}

                      {/* Price & CTA */}
                      <div className="flex items-end justify-between gap-4 pt-4 border-t border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Price</p>
                          <span className="text-3xl md:text-4xl font-display font-bold text-foreground">
                            £{Number(course.price).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => handleEnroll(course.id, course.title)}
                          disabled={enrollingId === course.id}
                          className={`min-w-[160px] font-semibold rounded-xl transition-all duration-300 ${
                            isPurchased
                              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-emerald-900/30"
                              : isMentorship
                              ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
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

      {/* Payment Method Modal */}
      <AnimatePresence>
        {paymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setPaymentModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPaymentModal(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-1">Choose Payment Method</h3>
                <p className="text-sm text-muted-foreground">
                  Select how you'd like to pay for <strong>{paymentModal.title}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleStripePayment(paymentModal.courseId)}
                  className="w-full h-14 text-base font-semibold rounded-xl bg-[#635BFF] hover:bg-[#5851DB] text-white gap-3"
                >
                  <CreditCard className="w-5 h-5" />
                  Pay with Card (Stripe)
                </Button>
                <Button
                  onClick={() => handlePayPalPayment(paymentModal.courseId)}
                  className="w-full h-14 text-base font-semibold rounded-xl bg-[#0070BA] hover:bg-[#005EA6] text-white gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.654h6.803c2.261 0 3.856.58 4.74 1.724.392.508.65 1.063.77 1.66.126.63.085 1.385-.12 2.302l-.004.018v.46l.357.183c.3.147.54.314.726.5.332.33.547.75.639 1.243.094.507.06 1.107-.1 1.784-.183.778-.48 1.458-.883 2.023a4.225 4.225 0 0 1-1.378 1.248c-.53.32-1.145.558-1.833.707a9.585 9.585 0 0 1-2.233.25h-.53a1.591 1.591 0 0 0-1.573 1.342l-.04.213-.665 4.216-.03.155a.16.16 0 0 1-.158.135H7.076z" />
                  </svg>
                  Pay with PayPal
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                All payments are secure and encrypted
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Courses;
