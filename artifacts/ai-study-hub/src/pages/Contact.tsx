import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareHeart, Send, CheckCircle2, Star, X } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { cn } from "@/lib/utils";

type Category = "bug" | "feature" | "ux" | "ai-quality" | "general";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "ux", label: "UX / Design" },
  { value: "ai-quality", label: "AI Quality" },
  { value: "general", label: "General" },
];

export default function Feedback() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [category, setCategory] = useState<Category>("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRating = hoveredStar || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          rating,
          category,
          message: message.trim(),
          page: window.location.pathname,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setRating(0);
    setCategory("general");
    setMessage("");
    setError(null);
    setSent(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <ToolHeader
        title="Feedback"
        description="Help us improve Neural Sync. Tell us what you love, what's broken, or what you'd like to see next."
        icon={MessageSquareHeart}
      />

      <div className="mt-8">
        {!sent ? (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="bg-card border border-card-border rounded-2xl p-8 md:p-10"
          >
            {/* Star rating */}
            <div className="mb-8">
              <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                How would you rate your experience?
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={cn(
                        "transition-colors duration-150",
                        star <= currentRating
                          ? "text-accent fill-accent"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
                {currentRating > 0 && (
                  <span className="ml-3 text-sm font-medium text-muted-foreground">
                    {currentRating === 1 && "Poor"}
                    {currentRating === 2 && "Fair"}
                    {currentRating === 3 && "Good"}
                    {currentRating === 4 && "Great"}
                    {currentRating === 5 && "Excellent"}
                  </span>
                )}
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                      category === cat.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input bg-background text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Your Feedback
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-background border border-input rounded-xl p-4 min-h-[140px] outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                placeholder="Tell us what you think, what's broken, or what you'd like to see..."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium">
                <X size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} /> Submit Feedback
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-card-border rounded-2xl p-10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-serif text-2xl font-medium text-foreground mb-2">
              Thank you, {name.split(" ")[0] || "there"}!
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Your feedback has been saved. It helps us make Neural Sync better for everyone.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-input bg-background hover:bg-muted text-foreground font-bold rounded-xl transition-colors"
            >
              Submit Another
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
