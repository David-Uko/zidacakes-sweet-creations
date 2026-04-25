import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LifeBuoy, Send, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi! How can we help you today? Ask us about orders, delivery, payment, or products.",
};

const SupportWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      // If user is not logged in, give a helpful fallback response
      if (!user) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Please sign in to use our live support chat. You can also reach us directly at hello@zidacakes.com or via the Contact page.",
          },
        ]);
        setSending(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("support-assistant", {
        body: { message: text },
      });

      if (error) throw new Error(error.message || "Support assistant is unavailable");

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            data?.response ||
            "Thanks for your message — our support team will follow up shortly.",
        },
      ]);

      if (data?.needsHumanFollowup) {
        toast({
          title: "Support ticket recorded",
          description: "Your message was flagged for a human follow-up.",
        });
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I couldn't answer that right now. Your request has been saved and our team will follow up.",
        },
      ]);
      toast({
        title: "Support assistant unavailable",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-[80] h-14 w-14 rounded-full bg-gradient-pink text-primary-foreground shadow-pink-lg flex items-center justify-center"
        aria-label="Open customer support"
      >
        {open ? <X className="w-6 h-6" /> : <LifeBuoy className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-5 z-[80] w-[min(92vw,380px)] rounded-3xl border border-border bg-card/95 backdrop-blur-md shadow-pink-lg overflow-hidden"
          >
            <header className="px-4 py-3 border-b border-border bg-gradient-pink-soft">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Customer Support</h2>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-1">
                {user
                  ? `Signed in as ${user.email}`
                  : "Sign in to use live support chat."}
              </p>
            </header>

            <div ref={messagesRef} className="h-72 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm font-body leading-relaxed ${
                    message.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "ml-auto bg-primary text-primary-foreground"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {sending && (
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm font-body bg-muted text-muted-foreground">
                  Typing...
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Type your question..." : "Sign in to chat..."}
                disabled={!user}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !input.trim() || !user}
                size="icon"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportWidget;