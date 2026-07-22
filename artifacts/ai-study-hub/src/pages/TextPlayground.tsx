import { useState, useMemo } from "react";
import { useTransformText } from "@workspace/api-client-react";
import { Wand2, Copy, Check, Type, RotateCcw } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils";

type Mode = "summarize" | "expand" | "simplify" | "rewrite" | "translate" | "fix-grammar";

const MODE_DESCRIPTIONS: Record<Mode, string> = {
  summarize: "Condense the text while keeping key points",
  expand: "Add detail and examples to enrich the text",
  simplify: "Rewrite in plain, easy-to-understand language",
  rewrite: "Improve clarity and flow",
  translate: "Translate to another language",
  "fix-grammar": "Correct grammar, spelling, and punctuation",
};

export default function TextPlayground() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("summarize");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [copied, setCopied] = useState(false);
  
  const transformText = useTransformText();
  const result = transformText.data?.result;

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(Boolean).length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, sentences, readTime };
  }, [text]);

  const resultStats = useMemo(() => {
    if (!result) return null;
    const trimmed = result.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = result.length;
    return { words, chars };
  }, [result]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    transformText.mutate({ data: { text, mode, targetLanguage: mode === 'translate' ? targetLanguage : undefined } });
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <ToolHeader 
        title="Text Playground" 
        description="Summarize, rewrite, translate, or simplify any block of text instantly."
        icon={Wand2}
      />

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        
        {/* Editor Side */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-border bg-secondary/30 flex flex-wrap gap-2 items-center">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="bg-background border border-input text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:border-primary"
            >
              <option value="summarize">Summarize</option>
              <option value="expand">Expand</option>
              <option value="simplify">Simplify</option>
              <option value="rewrite">Rewrite</option>
              <option value="fix-grammar">Fix Grammar</option>
              <option value="translate">Translate</option>
            </select>

            {mode === "translate" && (
              <input
                type="text"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                placeholder="e.g., Spanish, Japanese..."
                className="bg-background border border-input text-sm rounded-lg px-3 py-1.5 w-32 outline-none focus:border-primary"
              />
            )}

            <div className="flex-1" />

            <button
              onClick={() => { setText(""); transformText.reset(); }}
              disabled={!text.trim()}
              className="text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-background transition-colors disabled:opacity-30"
              title="Clear text"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={handleSubmit}
              disabled={!text.trim() || transformText.isPending || (mode === 'translate' && !targetLanguage.trim())}
              className={cn(
                "bg-primary text-primary-foreground font-bold px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors",
                (!text.trim() || transformText.isPending || (mode === 'translate' && !targetLanguage.trim()))
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-primary/90"
              )}
            >
              <Wand2 size={14} />
              Transform
            </button>
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here..."
            className="flex-1 p-6 w-full min-h-[400px] lg:min-h-[500px] bg-transparent outline-none resize-none text-foreground/90 text-lg leading-relaxed font-serif"
          />

          {/* Input Stats Bar */}
          <div className="px-4 py-2.5 border-t border-border bg-secondary/20 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Type size={12} />
              {stats.words} words
            </span>
            <span>{stats.chars} chars</span>
            <span>{stats.sentences} sentences</span>
            <div className="flex-1" />
            <span className="text-primary font-medium">{MODE_DESCRIPTIONS[mode]}</span>
          </div>
        </div>

        {/* Result Side */}
        <div className="bg-muted/30 border border-border rounded-2xl overflow-hidden flex flex-col relative">
          
          {transformText.isPending ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <LoadingState title="Working magic..." messages={["Analyzing text..."]} />
            </div>
          ) : transformText.isError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <ErrorState onRetry={() => handleSubmit()} />
            </div>
          ) : null}

          <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center h-[61px]">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-2">Result</span>
            {result && (
              <button 
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium px-2 py-1 rounded hover:bg-secondary transition-colors"
              >
                {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {result ? (
              <div className="text-lg leading-relaxed text-foreground font-serif whitespace-pre-wrap">
                {result}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Wand2 size={28} className="opacity-30" />
                </div>
                <p className="font-medium text-lg mb-1">Results will appear here</p>
                <p className="text-sm text-muted-foreground/30">Type or paste text, then click Transform</p>
              </div>
            )}
          </div>

          {/* Result Stats Bar */}
          {resultStats && (
            <div className="px-4 py-2.5 border-t border-border bg-secondary/20 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{resultStats.words} words</span>
              <span>{resultStats.chars} chars</span>
              <div className="flex-1" />
              <span className={resultStats.words < stats.words ? "text-primary" : resultStats.words > stats.words ? "text-accent-foreground" : "text-muted-foreground"}>
                {resultStats.words < stats.words
                  ? `${Math.round((1 - resultStats.words / stats.words) * 100)}% shorter`
                  : resultStats.words > stats.words
                    ? `+${Math.round((resultStats.words / stats.words - 1) * 100)}% longer`
                    : "Same length"}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
