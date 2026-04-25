import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, BookOpen, Loader2, Calendar, Phone, Mail,
  User, ChevronRight, Sparkles, MapPin, Clock, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addDays, addWeeks, getDay } from "date-fns";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Generate 30 available dates starting 2 weeks from today
function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  const start = addWeeks(new Date(), 2);
  let current = new Date(start);
  current.setHours(0, 0, 0, 0);
  while (dates.length < 30) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }
  return dates;
}

const CourseSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isMentorship, setIsMentorship] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"success" | "booking" | "done">("success");

  // Form state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const sessionId = searchParams.get("session_id");
  const cId = searchParams.get("course_id");
  const isPayPal = searchParams.get("paypal") === "true";
  const paypalToken = searchParams.get("token");

  const availableDates = useMemo(() => getAvailableDates(), []);
  const twoWeeksFromNow = addWeeks(new Date(), 2);

  useEffect(() => {
    const verify = async () => {
      if (isPayPal && cId && paypalToken) {
        try {
          const { data, error: fnError } = await supabase.functions.invoke("capture-course-paypal-order", {
            body: { paypalOrderId: paypalToken, courseId: cId },
          });
          if (fnError) throw fnError;
          if (data?.success) {
            setCourseName(data.courseName || "your course");
            setCourseId(cId);
            // Check if mentorship
            const { data: course } = await supabase
              .from("courses")
              .select("is_mentorship")
              .eq("id", cId)
              .single();
            setIsMentorship(course?.is_mentorship || false);
          } else {
            setError(data?.error || "PayPal payment verification failed.");
          }
        } catch (err: any) {
          setError("Failed to verify PayPal payment. Please contact support.");
        } finally {
          setVerifying(false);
        }
        return;
      }

      if (!sessionId || !cId) {
        setError("Missing payment information.");
        setVerifying(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("verify-course-payment", {
          body: { sessionId, courseId: cId },
        });
        if (fnError) throw fnError;
        if (data?.success) {
          setCourseName(data.courseName || "your course");
          setCourseId(cId);
          const { data: course } = await supabase
            .from("courses")
            .select("is_mentorship")
            .eq("id", cId)
            .single();
          setIsMentorship(course?.is_mentorship || false);
        } else {
          setError(data?.error || "Payment verification failed.");
        }
      } catch (err: any) {
        setError("Failed to verify payment. Please contact support.");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [sessionId, cId, isPayPal, paypalToken]);

  const toggleDay = (date: Date) => {
    setSelectedDays((prev) => {
      const exists = prev.find((d) => d.toDateString() === date.toDateString());
      if (exists) return prev.filter((d) => d.toDateString() !== date.toDateString());
      if (prev.length >= 3) {
        toast.error("You can only select 3 days per week.");
        return prev;
      }
      return [...prev, date];
    });
  };

  const handleBookingSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (selectedDays.length !== 3) {
      toast.error("Please select exactly 3 days for your classes.");
      return;
    }

    setSubmitting(true);
    try {
      // Save to Supabase
      if (user) {
        await supabase.from("course_bookings").insert({
          user_id: user.id,
          course_id: courseId,
          full_name: fullName,
          email: email,
          phone: phone,
          selected_days: selectedDays.map((d) => format(d, "yyyy-MM-dd")),
        });
      }

      // Send to admin via Web3Forms
      const formattedDays = selectedDays
        .sort((a, b) => a.getTime() - b.getTime())
        .map((d) => `${FULL_DAY_NAMES[getDay(d)]} ${format(d, "do MMMM yyyy")}`)
        .join(", ");

      const web3Key = import.meta.env.VITE_WEB3FORMS_KEY;
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: web3Key || "YOUR_WEB3FORMS_KEY",
          subject: `New 1:1 SMBC Class Booking — ${fullName}`,
          from_name: "Zidacakes'n'more Bookings",
          name: fullName,
          email: email,
          message: `New physical class booking!\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nCourse: ${courseName}\n\nSelected Class Days:\n${formattedDays}`,
        }),
      });

      setStep("done");
    } catch (err: any) {
      toast.error("Failed to submit booking. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Verifying your payment...</p>
          <p className="text-sm text-muted-foreground/60 mt-1">This will only take a moment</p>
        </motion.div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-destructive mb-4">{error}</p>
          <Link to="/courses"><Button>Back to Courses</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen bg-background overflow-hidden">
      <AnimatePresence mode="wait">

        {/* STEP 1 — Payment Success */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen flex items-center justify-center px-4"
          >
            <div className="text-center max-w-lg mx-auto">
              {/* Animated checkmark */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="relative w-28 h-28 mx-auto mb-8"
              >
                <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-ping opacity-30" />
                <div className="relative w-28 h-28 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-14 h-14 text-emerald-600" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
                  <Sparkles className="w-4 h-4" /> Payment Confirmed
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  Congratulations! 🎉
                </h1>
                <p className="text-muted-foreground text-lg mb-3 leading-relaxed">
                  You've successfully enrolled in <strong className="text-foreground">{courseName}</strong>.
                </p>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  You're now one step closer to mastering Swiss Meringue Buttercream with personalised, hands-on coaching at our UK training centre.
                </p>

                {/* Info cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: <MapPin className="w-4 h-4" />, label: "Location", value: "UK Training Centre" },
                    { icon: <Clock className="w-4 h-4" />, label: "Format", value: "Physical Classes" },
                    { icon: <Star className="w-4 h-4" />, label: "Style", value: "1-to-1 Coaching" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="p-3 rounded-xl border border-border bg-muted/30 text-center"
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary mb-2">
                        {item.icon}
                      </span>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </motion.div>
                  ))}
                </div>

                {isMentorship ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Button
                      size="lg"
                      onClick={() => setStep("booking")}
                      className="bg-primary hover:bg-primary/90 gap-2 px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
                    >
                      Book Your Classes <ChevronRight className="w-5 h-5" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      Takes less than 2 minutes to complete
                    </p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={`/courses/${courseId}`}>
                      <Button className="bg-primary hover:bg-primary/90 gap-2 w-full">
                        <BookOpen className="w-4 h-4" /> Access Course
                      </Button>
                    </Link>
                    <Link to="/my-courses">
                      <Button variant="outline" className="w-full">My Courses</Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Booking Form */}
        {step === "booking" && (
          <motion.div
            key="booking"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5 }}
            className="py-12 px-4"
          >
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                  <Calendar className="w-4 h-4" /> Schedule Your Classes
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
                  Book Your Training Days
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Fill in your details and select <strong>3 days</strong> for your classes.
                  Available dates begin <strong>{format(twoWeeksFromNow, "do MMMM yyyy")}</strong> — two weeks from today.
                </p>
              </motion.div>

              <div className="space-y-8">
                {/* Personal Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                    Your Details
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Phone Number"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Day Picker */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
                    Select Your 3 Class Days
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Choose any 3 dates from the calendar below.
                    <span className="ml-2 inline-flex items-center gap-1 text-primary font-medium">
                      {selectedDays.length}/3 selected
                    </span>
                  </p>

                  {/* Notice banner */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Dates available from <strong>{format(twoWeeksFromNow, "EEEE do MMMM yyyy")}</strong>. This gives us time to prepare your personalised training plan.
                    </p>
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {DAY_NAMES.map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Month grouping */}
                  {Array.from(
                    availableDates.reduce((groups, date) => {
                      const key = format(date, "MMMM yyyy");
                      if (!groups.has(key)) groups.set(key, []);
                      groups.get(key)!.push(date);
                      return groups;
                    }, new Map<string, Date[]>())
                  ).map(([month, dates]) => (
                    <div key={month} className="mb-6">
                      <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" /> {month}
                      </p>
                      <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for day offset */}
                        {Array.from({ length: getDay(dates[0]) }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {dates.map((date) => {
                          const isSelected = selectedDays.some(
                            (d) => d.toDateString() === date.toDateString()
                          );
                          const selIndex = selectedDays.findIndex(
                            (d) => d.toDateString() === date.toDateString()
                          );
                          return (
                            <motion.button
                              key={date.toISOString()}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleDay(date)}
                              className={`relative aspect-square rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all duration-200 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                  : "bg-muted/50 hover:bg-primary/10 hover:text-primary text-foreground"
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">
                                  {selIndex + 1}
                                </span>
                              )}
                              <span>{format(date, "d")}</span>
                              <span className="text-[9px] opacity-70">{DAY_NAMES[getDay(date)]}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Selected days summary */}
                  {selectedDays.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
                    >
                      <p className="text-sm font-semibold text-primary mb-2">Your selected days:</p>
                      <div className="space-y-1">
                        {selectedDays
                          .sort((a, b) => a.getTime() - b.getTime())
                          .map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                {i + 1}
                              </span>
                              <span>{FULL_DAY_NAMES[getDay(d)]}, {format(d, "do MMMM yyyy")}</span>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Button
                    size="lg"
                    onClick={handleBookingSubmit}
                    disabled={submitting || selectedDays.length !== 3 || !fullName || !email || !phone}
                    className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Confirm Booking <ChevronRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Your information is kept private and secure.
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3 — Booking Confirmed */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex items-center justify-center px-4"
          >
            <div className="text-center max-w-lg mx-auto">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative w-28 h-28 mx-auto mb-8"
              >
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
                <div className="relative w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-14 h-14 text-primary" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                  You're All Set! ✨
                </h1>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Your booking has been received. Our team will reach out to you via <strong>email or phone call</strong> with further information regarding your classes, including the <strong>exact location, time, and what to bring</strong>.
                </p>

                <div className="p-5 rounded-2xl border border-border bg-muted/30 mb-8 text-left">
                  <p className="text-sm font-semibold mb-3 text-foreground">What happens next:</p>
                  {[
                    "We review your selected class dates",
                    "Our team contacts you within 24–48 hours",
                    "You receive full class details including location and time",
                    "Show up and start your baking journey!",
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start gap-3 mb-2 last:mb-0"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </motion.div>
                  ))}
                </div>

                <Link to="/">
                  <Button className="bg-primary hover:bg-primary/90 gap-2 px-8">
                    Back to Home
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
};

export default CourseSuccess;