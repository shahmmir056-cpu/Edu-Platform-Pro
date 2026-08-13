import { useEffect, useState } from "react";
import { useGenerateResearch } from "@workspace/api-client-react";
import { BookOpen, Search, Download } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState, isValidationError } from "@/components/ui/LoadingState";
import { trackAction } from "@/features/life-os/tracker";

type Depth = "overview" | "standard" | "deep";

export default function Research() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const generateResearch = useGenerateResearch();
  const report = generateResearch.data;

  useEffect(() => {
    if (report) {
      trackAction("/research", "research-done", undefined, 1, topic.trim(), `${report.sections.length} sections: ${report.title}`);
    }
  }, [report]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    generateResearch.mutate({ data: { topic, depth } });
  };

  const reset = () => {
    generateResearch.reset();
    setTopic("");
  };

  const handleRetry = () => {
    if (isValidationError(generateResearch.error)) {
      generateResearch.reset();
    } else {
      handleSubmit();
    }
  };

  const downloadReport = () => {
    if (!report) return;
    let text = `${report.title}\n\n`;
    text += `EXECUTIVE SUMMARY\n${report.summary}\n\n`;
    report.sections.forEach((section, i) => {
      text += `${section.heading}\n${"─".repeat(40)}\n${section.content}\n\n`;
    });
    text += `KEY TAKEAWAYS\n${report.keyTakeaways.map((t) => `• ${t}`).join("\n")}\n\n`;
    text += `FURTHER QUESTIONS\n${report.furtherQuestions.map((q) => `? ${q}`).join("\n")}\n\n`;
    if (report.suggestedSources?.length) {
      text += `SUGGESTED SOURCES\n${report.suggestedSources.map((s) => `• ${s.title} — ${s.note}`).join("\n")}\n`;
    }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.toLowerCase().replace(/\s+/g, "-")}-research-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <ToolHeader 
        title="Deep Research" 
        description="Generate structured, academic-grade research reports on any topic."
        icon={BookOpen}
      />

      {!generateResearch.isPending && !report && !generateResearch.isError && (
        <form onSubmit={handleSubmit} className="animate-fade-in-up lg-card rounded-2xl p-8 max-w-2xl mx-auto mt-12 border-t-4 border-t-primary">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                Research Topic
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The economic impact of the Silk Road during the 13th century..."
                className="lg-input w-full rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-lg resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#6B6B6B" }}>
                Research Depth
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {(["overview", "standard", "deep"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium capitalize tracking-wide transition-all ${
                      depth === d 
                        ? "lg-badge border-primary bg-primary/5 shadow-sm" 
                        : "lg-button-outline"
                    }`}
                    style={depth === d ? { color: "#FF9F4C" } : undefined}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!topic.trim() || generateResearch.isPending}
              className="lg-button w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md mt-4"
            >
              <Search size={20} />
              Start Research
            </button>
          </div>
        </form>
      )}

      {generateResearch.isPending && (
        <LoadingState 
          title="Conducting Research..." 
          messages={[
            "Gathering sources...",
            "Analyzing historical context...",
            "Extracting key takeaways...",
            "Structuring report sections...",
            "Drafting summary..."
          ]} 
        />
      )}

      {generateResearch.isError && (
        <ErrorState
          onRetry={handleRetry}
          error={generateResearch.error ?? null}
          message="Failed to generate the research report. Please try modifying your topic."
        />
      )}

      {report && !generateResearch.isPending && (
        <div className="animate-fade-in-up space-y-12">
          {/* Document Header */}
          <div className="lg-card p-8 md:p-12 rounded-2xl">
            <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight" style={{ color: "#FF9F4C" }}>
              {report.title}
            </h2>
            <div className="p-6 bg-primary/5 border-l-4 border-primary rounded-r-xl">
<h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Executive Summary</h3>
               <p className="text-base sm:text-lg leading-relaxed" style={{ color: "#2D2D2D" }}>{report.summary}</p>
            </div>
          </div>

          {/* Report Sections */}
          <div className="space-y-12">
            {report.sections.map((section, idx) => (
              <section key={idx} className="lg-card p-8 rounded-2xl">
                <h3 className="text-xl sm:text-2xl font-serif text-primary mb-4 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                  {section.heading}
                </h3>
                <div className="prose prose-slate max-w-none prose-headings:font-serif prose-p:leading-relaxed" style={{ color: "#2D2D2D" }}>
                  {section.content.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Key Takeaways */}
            <div className="lg-card p-8 rounded-2xl" style={{ background: "rgba(255,159,76,0.04)" }}>
              <h3 className="text-xl font-serif mb-4" style={{ color: "#FF9F4C" }}>Key Takeaways</h3>
              <ul className="space-y-3">
                {report.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="flex gap-3" style={{ color: "#2D2D2D" }}>
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Further Questions */}
            <div className="lg-card p-8 rounded-2xl">
              <h3 className="text-xl font-serif mb-4" style={{ color: "#FF9F4C" }}>Further Questions</h3>
              <ul className="space-y-3">
                {report.furtherQuestions.map((item, idx) => (
                  <li key={idx} className="flex gap-3" style={{ color: "#2D2D2D" }}>
                    <span className="text-primary font-bold mt-0.5">?</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Sources */}
          {report.suggestedSources && report.suggestedSources.length > 0 && (
            <div className="lg-card p-8 rounded-2xl">
              <h3 className="text-xl font-serif mb-4" style={{ color: "#FF9F4C" }}>Suggested Sources</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {report.suggestedSources.map((source, idx) => (
                  <div key={idx} className="lg-subtle p-4 rounded-xl">
                    <p className="font-bold text-sm mb-1" style={{ color: "#FF9F4C" }}>{source.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>{source.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-8 pb-20" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <button 
              onClick={reset}
              className="lg-button-outline px-6 py-3 font-bold rounded-xl transition-colors"
            >
              New Research
            </button>
            <button 
              onClick={downloadReport}
              className="lg-button px-6 py-3 font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <Download size={18} />
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
