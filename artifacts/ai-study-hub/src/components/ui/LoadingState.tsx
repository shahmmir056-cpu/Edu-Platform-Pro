import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  messages?: string[];
}

const DEFAULT_MESSAGES = [
  "Analyzing context...",
  "Synthesizing sources...",
  "Structuring concepts...",
  "Drafting content...",
  "Applying academic rigor...",
  "Polishing details..."
];

export function LoadingState({ 
  title = "AI is working...", 
  messages = DEFAULT_MESSAGES 
}: LoadingStateProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <div className="absolute inset-0 -z-10 bg-primary/10 blur-3xl rounded-full scale-[2]" />
        
        {/* Spinning ring */}
        <motion.div
          className="w-24 h-24 rounded-full border-4 border-primary/15"
          style={{ borderTopColor: "hsl(var(--primary))", borderRightColor: "hsl(var(--primary))" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner spinning ring (counter) */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-accent/20"
          style={{ borderBottomColor: "hsl(var(--accent))" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-8 h-8 text-accent" />
          </motion.div>
        </div>
      </div>

      <h3 className="font-serif text-2xl font-medium text-foreground mb-4">
        {title}
      </h3>
      
      <div className="h-6 relative w-72 overflow-hidden text-center">
        {messages.map((msg, i) => (
          <motion.p
            key={msg}
            className="absolute inset-0 w-full text-muted-foreground text-sm tracking-wide uppercase font-medium"
            initial={{ y: 20, opacity: 0 }}
            animate={{ 
              y: messageIndex === i ? 0 : (messageIndex > i ? -20 : 20), 
              opacity: messageIndex === i ? 1 : 0 
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {msg}
          </motion.p>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="w-56 h-1.5 bg-muted rounded-full mt-6 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 30, ease: "easeOut" }} 
        />
      </div>
      
      {/* Dot indicators */}
      <div className="flex items-center gap-1.5 mt-5">
        {messages.slice(0, 5).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            animate={{
              backgroundColor: messageIndex === i ? "hsl(var(--primary))" : "hsl(var(--muted))",
              scale: messageIndex === i ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "The AI encountered an error processing your request.", 
  onRetry 
}: { 
  title?: string; 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <span className="text-2xl text-destructive font-serif font-bold">!</span>
      </div>
      <h3 className="font-serif text-xl font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:-translate-y-0.5"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
