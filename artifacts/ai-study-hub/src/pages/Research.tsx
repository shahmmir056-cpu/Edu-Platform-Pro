import { useState } from "react";
import { useGenerateResearch } from "@workspace/api-client-react";
import { BookOpen, Search, Download } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";

type Depth = "overview" | "standard" | "deep";

export default function Research() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const generateResearch = useGenerateResearch();
  const report = generateResearch.data;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    generateResearch.mutate({ data: { topic, depth } });
  };

  const reset = () => {
    generateResearch.reset();
    setTopic("");
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
        <form onSubmit={handleSubmit} className="animate-fade-in-up glass-card rounded-2xl p-8 max-w-2xl mx-auto mt-12 border-t-4 border-t-primary">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Research Topic
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The economic impact of the Silk Road during the 13th century..."
                className="w-full bg-background border border-input rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-lg resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Research Depth
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(["overview", "standard", "deep"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium capitalize tracking-wide transition-all ${
                      depth === d 
                        ? "border-primary bg-primary/5 text-primary shadow-sm" 
                        : "border-input bg-background hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!topic.trim()}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md mt-4"
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
          onRetry={() => handleSubmit()} 
          message="Failed to generate the research report. Please try modifying your topic." 
        />
      )}

      {report && !generateResearch.isPending && (
        <div className="animate-fade-in-up space-y-12">
          {/* Document Header */}
          <div className="bg-card border border-card-border p-8 md:p-12 rounded-2xl shadow-sm">
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6 leading-tight">
              {report.title}
            </h2>
            <div className="p-6 bg-primary/5 border-l-4 border-primary rounded-r-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Executive Summary</h3>
              <p className="text-lg leading-relaxed text-foreground/80">{report.summary}</p>
            </div>
          </div>

          {/* Report Sections */}
          <div className="space-y-12">
            {report.sections.map((section, idx) => (
              <section key={idx} className="bg-card border border-card-border p-8 rounded-2xl">
                <h3 className="text-2xl font-serif text-primary mb-4 pb-4 border-b border-border">
                  {section.heading}
                </h3>
                <div className="prose prose-slate max-w-none text-foreground/80 prose-headings:font-serif prose-p:leading-relaxed">
                  {section.content.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Key Takeaways */}
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-2xl">
              <h3 className="text-xl font-serif text-accent-foreground mb-4">Key Takeaways</h3>
              <ul className="space-y-3">
                {report.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-foreground/80">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Further Questions */}
            <div className="bg-secondary p-8 rounded-2xl">
              <h3 className="text-xl font-serif text-foreground mb-4">Further Questions</h3>
              <ul className="space-y-3">
                {report.furtherQuestions.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-foreground/80">
                    <span className="text-primary font-bold mt-0.5">?</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Sources */}
          {report.suggestedSources && report.suggestedSources.length > 0 && (
            <div className="bg-card border border-card-border p-8 rounded-2xl">
              <h3 className="text-xl font-serif text-foreground mb-4">Suggested Sources</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {report.suggestedSources.map((source, idx) => (
                  <div key={idx} className="bg-secondary/50 p-4 rounded-xl border border-border">
                    <p className="font-bold text-foreground text-sm mb-1">{source.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{source.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-8 pb-20 border-t border-border">
            <button 
              onClick={reset}
              className="px-6 py-3 border-2 border-input bg-background hover:bg-muted text-foreground font-bold rounded-xl transition-colors"
            >
              New Research
            </button>
            <button 
              onClick={downloadReport}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
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
