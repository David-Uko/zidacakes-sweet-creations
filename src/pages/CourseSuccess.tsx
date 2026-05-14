import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
import { format, addWeeks, addDays, isBefore, startOfDay } from "date-fns";

const WEEKDAYS = [
  { label: "Mon", full: "Monday", value: 1 },
  { label: "Tue", full: "Tuesday", value: 2 },
  { label: "Wed", full: "Wednesday", value: 3 },
  { label: "Thu", full: "Thursday", value: 4 },
  { label: "Fri", full: "Friday", value: 5 },
];

const WEB3FORMS_KEY = "517ec22b-c8b1-4f3b-9b55-a17d8780862e";

const CourseSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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
  const [startDate, setStartDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const sessionId = searchParams.get("session_id");
  const cId = searchParams.get("course_id");
  const isPayPal = searchParams.get("paypal") === "true";
  const paypalToken = searchParams.get("token");

  // Min date = 2 weeks from today
  const minDate = useMemo(() => {
    const d = addWeeks(new Date(), 2);
    return format(d, "yyyy-MM-dd");
  }, []);

  // Max date = 3 months from today
  const maxDate = useMemo(() => {
    const d = addWeeks(new Date(), 14);
    return format(d, "yyyy-MM-dd");
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (isPayPal && cId && paypalToken) {
        try {
          const { data, error: fnError } = await supabase.functions.invoke(
            "capture-course-paypal-order",
            { body: { paypalOrderId: paypalToken, courseId: cId } }
          );
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
        const { data, error: fnError } = await supabase.functions.invoke(
          "verify-course-payment",
          { body: { sessionId, courseId: cId } }
        );
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

  const toggleDay = (val: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(val)) return prev.filter((d) => d !== val);
      if (prev.length >= 3) {
        toast.error("You can only select 3 days.");
        return prev;
      }
      return [...prev, val];
    });
  };

  const handleBookingSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all your details.");
      return;
    }
    if (!startDate) {
      toast.error("Please select a start date.");
      return;
    }
    if (selectedDays.length !== 3) {
      toast.error("Please select exactly 3 days per week.");
      return;
    }

    // Validate start date is at least 2 weeks away
    const chosen = startOfDay(new Date(startDate));
    const earliest = startOfDay(addWeeks(new Date(), 2));
    if (isBefore(chosen, earliest)) {
      toast.error("Start date must be at least 2 weeks from today.");
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
          selected_days: selectedDays.map(
            (v) => WEEKDAYS.find((d) => d.value === v)?.full || ""
          ),
        });
      }

      const dayNames = selectedDays
        .sort((a, b) => a - b)
        .map((v) => WEEKDAYS.find((d) => d.value === v)?.full)
        .join(", ");

      const formattedStart = format(new Date(startDate), "EEEE do MMMM yyyy");

      // Send to admin via Web3Forms
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `New 1-to-1 SMBC Booking — ${fullName}`,
          from_name: "Zidacakes'n'more Bookings",
          name: fullName,
          email: email,
          phone: phone,
          course: courseName,
          start_date: formattedStart,
          class_days: dayNames,
          message: `New physical class booking!\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nCourse: ${courseName}\nRequested Start Date: ${formattedStart}\nClass Days: ${dayNames}`,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error("Web3Forms submission failed: " + result.message);
      }

      setStep("done");
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
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

  // Error
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

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
                  <Sparkles className="w-4 h-4" /> Payment Confirmed
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  Congratulations! 🎉
                </h1>
                <p className="text-muted-foreground text-lg mb-3 leading-relaxed">
                  You have successfully enrolled in{" "}
                  <strong className="text-foreground">{courseName}</strong>.
                </p>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  You are now one step closer to mastering Swiss Meringue Buttercream with
                  personalised, hands-on coaching at our UK training centre.
                </p>

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
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                    <Button
                      size="lg"
                      onClick={() => setStep("booking")}
                      className="bg-primary hover:bg-primary/90 gap-2 px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
                    >
                      Book Your Classes <ChevronRight className="w-5 h-5" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">Takes less than 2 minutes</p>
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
            <div className="max-w-xl mx-auto">

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                  <Calendar className="w-4 h-4" /> Schedule Your Classes
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
                  Book Your Training
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Choose your preferred start date and 3 days per week for your classes.
                  Your start date must be at least{" "}
                  <strong>2 weeks from today</strong>.
                </p>
              </motion.div>

              <div className="space-y-6">

                {/* Personal Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      1
                    </span>
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

                {/* Start Date */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    Preferred Start Date
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the date you would like your classes to begin.
                  </p>

                  {/* Notice */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Earliest available start date is{" "}
                      <strong>{format(addWeeks(new Date(), 2), "EEEE do MMMM yyyy")}</strong>.
                      This allows us time to prepare your personalised training plan.
                    </p>
                  </div>

                  <input
                    type="date"
                    value={startDate}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />

                  {startDate && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-primary font-medium mt-3 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Classes will begin on{" "}
                      <strong>{format(new Date(startDate), "EEEE do MMMM yyyy")}</strong>
                    </motion.p>
                  )}
                </motion.div>

                {/* Day Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    Choose Your 3 Days Per Week
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Select exactly 3 days from Monday to Friday that work best for you each week.
                    <span className="ml-2 text-primary font-medium">
                      {selectedDays.length}/3 selected
                    </span>
                  </p>

                  <div className="grid grid-cols-5 gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = selectedDays.includes(day.value);
                      return (
                        <motion.button
                          key={day.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleDay(day.value)}
                          className={`relative flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all duration-200 font-semibold text-sm ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                              : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                          }`}
                        >
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold shadow-md"
                            >
                              {selectedDays.indexOf(day.value) + 1}
                            </motion.span>
                          )}
                          <span className="text-base">{day.label}</span>
                          <span className="text-[9px] mt-0.5 opacity-60 hidden sm:block">{day.full}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Selected summary */}
                  <AnimatePresence>
                    {selectedDays.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
                      >
                        <p className="text-sm font-semibold text-primary mb-2">Your weekly schedule:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDays
                            .sort((a, b) => a - b)
                            .map((v) => {
                              const day = WEEKDAYS.find((d) => d.value === v);
                              return (
                                <span
                                  key={v}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  {day?.full}
                                </span>
                              );
                            })}
                        </div>
                        {startDate && selectedDays.length === 3 && (
                          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                            Starting{" "}
                            <strong className="text-foreground">
                              {format(new Date(startDate), "do MMMM yyyy")}
                            </strong>
                            , your classes will run every{" "}
                            <strong className="text-foreground">
                              {selectedDays
                                .sort((a, b) => a - b)
                                .map((v) => WEEKDAYS.find((d) => d.value === v)?.full)
                                .join(", ")}
                            </strong>
                            .
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Submit */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Button
                    size="lg"
                    onClick={handleBookingSubmit}
                    disabled={
                      submitting ||
                      selectedDays.length !== 3 ||
                      !fullName.trim() ||
                      !email.trim() ||
                      !phone.trim() ||
                      !startDate
                    }
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

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                  You are All Set! ✨
                </h1>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Your booking has been received. Our team will reach out to you via{" "}
                  <strong>email or phone call</strong> with further information about your classes,
                  including the <strong>exact location, time, and what to bring</strong>.
                </p>

                <div className="p-5 rounded-2xl border border-border bg-muted/30 mb-8 text-left">
                  <p className="text-sm font-semibold mb-3 text-foreground">What happens next:</p>
                  {[
                    "We review your selected start date and class days",
                    "Our team contacts you within 24 to 48 hours",
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