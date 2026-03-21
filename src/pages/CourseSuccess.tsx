import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const CourseSuccess = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [error, setError] = useState("");

  const sessionId = searchParams.get("session_id");
  const courseId = searchParams.get("course_id");

  useEffect(() => {
    const verify = async () => {
      if (!sessionId || !courseId) {
        setError("Missing payment information.");
        setVerifying(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("verify-course-payment", {
          body: { sessionId, courseId },
        });

        if (fnError) throw fnError;
        if (data?.success) {
          setCourseName(data.courseName || "your course");
        } else {
          setError(data?.error || "Payment verification failed.");
        }
      } catch (err: any) {
        setError("Failed to verify payment. Please contact support.");
        console.error(err);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [sessionId, courseId]);

  if (verifying) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-destructive mb-4">{error}</p>
          <Link to="/courses">
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold mb-3">Enrolment Confirmed!</h1>
        <p className="text-muted-foreground mb-8">
          You have successfully enrolled in <strong>{courseName}</strong>. A confirmation email has been sent to your inbox.
        </p>

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
      </motion.div>
    </main>
  );
};

export default CourseSuccess;
