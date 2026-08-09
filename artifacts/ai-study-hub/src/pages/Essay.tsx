import { useEffect, useState } from "react";
import { useGenerateEssay } from "@workspace/api-client-react";
import { PenTool, FileText, Download, Layers } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { trackAction } from "@/features/life-os/tracker";

type EssayType = "argumentative" | "narrative" | "expository" | "persuasive" | "descriptive" | "compare-contrast";

export default function Essay() {
  const [topic, setTopic] = useState("");
  const [essayType, setEssayType] = useState<EssayType>("expository");
  const [wordCount, setWordCount] = useState(200);
  const [tone, setTone] = useState("academic");
  const generateEssay = useGenerateEssay();
  const essay = generateEssay.data;

  useEffect(() => {
    if (essay) {
      trackAction("/essay", "essay-generated", undefined, 1, topic.trim(), essay.title);
    }
  }, [essay]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    generateEssay.mutate({ data: { topic, essayType, wordCount, tone } });
  };

  const reset = () => {
    generateEssay.reset();
    setTopic("");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <ToolHeader 
        title="Essay Writer" 
        description="Draft complete essays with structured outlines tailored to specific styles."
        icon={PenTool}
      />

      {!generateEssay.isPending && !essay && !generateEssay.isError && (
        <form onSubmit={handleSubmit} className="animate-fade-in-up lg-card rounded-2xl p-8 max-w-2xl mx-auto mt-12 border-t-4 border-t-primary">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                Essay Topic / Prompt
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The role of artificial intelligence in modern education..."
                className="lg-input w-full rounded-xl p-4 min-h-[100px] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                  Essay Type
                </label>
                <select
                  value={essayType}
                  onChange={(e) => setEssayType(e.target.value as EssayType)}
                  className="lg-input w-full rounded-xl p-3.5 focus:ring-2 focus:ring-ring outline-none capitalize"
                >
                  <option value="expository">Expository</option>
                  <option value="argumentative">Argumentative</option>
                  <option value="persuasive">Persuasive</option>
                  <option value="narrative">Narrative</option>
                  <option value="descriptive">Descriptive</option>
                  <option value="compare-contrast">Compare & Contrast</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="lg-input w-full rounded-xl p-3.5 focus:ring-2 focus:ring-ring outline-none"
                >
                  <option value="academic">Academic & Objective</option>
                  <option value="persuasive">Passionate & Persuasive</option>
                  <option value="analytical">Critical & Analytical</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
                  Target Word Count
                </label>
                <span className="text-sm font-mono font-bold text-primary">{wordCount} words</span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <button
              type="submit"
              disabled={!topic.trim() || generateEssay.isPending}
              className="lg-button w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md mt-8"
            >
              <FileText size={20} />
              Draft Essay
            </button>
          </div>
        </form>
      )}

      {generateEssay.isPending && (
        <LoadingState 
          title="Drafting your essay..." 
          messages={[
            "Structuring arguments...",
            "Creating outline...",
            "Writing introduction...",
            "Developing body paragraphs...",
            "Concluding essay..."
          ]} 
        />
      )}

      {generateEssay.isError && (
        <ErrorState 
          onRetry={() => handleSubmit()} 
          message="Failed to generate the essay. Please adjust your prompt and try again." 
        />
      )}

      {essay && !generateEssay.isPending && (
        <div className="animate-fade-in-up space-y-8 flex flex-col md:flex-row gap-8 items-start">
          
          {/* Outline Sidebar */}
          <div className="w-full md:w-72 shrink-0 lg-card p-6 rounded-2xl sticky top-8">
            <h3 className="font-serif text-lg font-bold text-primary pb-3 mb-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <Layers size={18} /> Outline
            </h3>
            <ol className="space-y-3 text-sm">
              {essay.outline.map((point, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="font-mono font-bold" style={{ color: "#6B6B6B" }}>{idx + 1}.</span>
                  <span className="leading-snug" style={{ color: "#2D2D2D" }}>{point}</span>
                </li>
              ))}
            </ol>
            
            <div className="mt-8 pt-4 space-y-3" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="flex justify-between text-xs">
                <span className="uppercase tracking-wider font-bold" style={{ color: "#6B6B6B" }}>Word Count</span>
                <span className="font-mono font-bold" style={{ color: "#FF9F4C" }}>{essay.wordCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="uppercase tracking-wider font-bold" style={{ color: "#6B6B6B" }}>Type</span>
                <span className="font-mono font-bold capitalize" style={{ color: "#FF9F4C" }}>{essayType}</span>
              </div>
            </div>
          </div>

          {/* Main Document */}
          <div className="flex-1 shadow-lg p-6 sm:p-10 md:p-16 rounded-xl w-full max-w-[800px] sm:min-h-[800px] font-serif text-base sm:text-lg leading-loose" 
            style={{ 
              background: "rgba(255,255,255,0.8)", 
              backdropFilter: "blur(20px) saturate(180%)",
               border: "1.5px solid rgba(255,255,255,0.72)",
              color: "#2D2D2D",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)"
            }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center leading-tight" style={{ color: "#FF9F4C" }}>
              {essay.title}
            </h2>
            
            <div className="space-y-6 whitespace-pre-wrap">
              {essay.body}
            </div>
          </div>
          
        </div>
      )}

      {essay && !generateEssay.isPending && (
        <div className="flex justify-center gap-4 mt-12 pb-20">
          <button 
            onClick={reset}
            className="lg-button-outline px-6 py-3 font-bold rounded-xl transition-colors"
          >
            New Essay
          </button>
          <button 
            onClick={() => {
              const file = new Blob([`${essay.title}\n\n${essay.body}`], {type: 'text/plain'});
              const url = URL.createObjectURL(file);
              const element = document.createElement("a");
              element.href = url;
              element.download = `${essay.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
              URL.revokeObjectURL(url);
            }}
            className="lg-button px-6 py-3 font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <Download size={18} />
            Download TXT
          </button>
        </div>
      )}
    </div>
  );
}
