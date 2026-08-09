import { useEffect, useState } from "react";
import { useGenerateStudyNotes } from "@workspace/api-client-react";
import { ClipboardList, Download, Book } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { trackAction } from "@/features/life-os/tracker";

export default function StudyNotes() {
  const [topic, setTopic] = useState("");
  const generateNotes = useGenerateStudyNotes();
  const notes = generateNotes.data;

  useEffect(() => {
    if (notes) {
      trackAction("/study-notes", "notes-generated", undefined, 1, topic.trim(), `${notes.sections.length} sections: ${notes.title}`);
    }
  }, [notes]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    generateNotes.mutate({ data: { topic } });
  };

  const reset = () => {
    generateNotes.reset();
    setTopic("");
  };

  const downloadNotes = () => {
    if (!notes) return;
    let text = `${notes.title}\n\n`;
    notes.sections.forEach((section, i) => {
      text += `${i + 1}. ${section.heading}\n${"─".repeat(40)}\n`;
      section.bullets.forEach((b) => { text += `  • ${b}\n`; });
      text += "\n";
    });
    if (notes.keyTerms.length > 0) {
      text += `GLOSSARY\n${"─".repeat(40)}\n`;
      notes.keyTerms.forEach((kt) => { text += `${kt.term}: ${kt.definition}\n`; });
    }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.toLowerCase().replace(/\s+/g, "-")}-study-notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <ToolHeader 
        title="Study Notes Generator" 
        description="Turn complex topics into structured notes with key terms and bullet points."
        icon={ClipboardList}
      />

      {!generateNotes.isPending && !notes && !generateNotes.isError && (
        <form onSubmit={handleSubmit} className="animate-fade-in-up lg-card rounded-2xl p-8 max-w-2xl mx-auto mt-12 border-t-4 border-t-primary">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                Subject or Chapter
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Chapter 4: Introduction to Quantum Mechanics..."
                className="lg-input w-full rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-lg resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!topic.trim()}
              className="lg-button w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md mt-4"
            >
              <ClipboardList size={20} />
              Generate Notes
            </button>
          </div>
        </form>
      )}

      {generateNotes.isPending && (
        <LoadingState 
          title="Compiling Notes..." 
          messages={["Extracting concepts...", "Structuring sections...", "Identifying key terms...", "Formatting bullets..."]} 
        />
      )}

      {generateNotes.isError && (
        <ErrorState onRetry={() => handleSubmit()} />
      )}

      {notes && !generateNotes.isPending && (
        <div className="animate-fade-in-up space-y-12">
          
          <div className="lg-card border-l-8 border-l-primary p-8 md:p-12 rounded-2xl">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4" style={{ color: "#FF9F4C" }}>
              {notes.title}
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 lg-badge text-sm font-bold uppercase tracking-widest rounded-md" style={{ color: "#E8852E" }}>
              <Book size={14} /> Review Material
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            <div className="flex-1 space-y-8">
              {notes.sections.map((section, idx) => (
                <section key={idx} className="lg-card p-8 rounded-2xl">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold mb-6 flex items-center gap-3" style={{ color: "#FF9F4C" }}>
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                      {idx + 1}
                    </span>
                    {section.heading}
                  </h3>
                  <ul className="space-y-4">
                    {section.bullets.map((bullet, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-2.5" />
                        <p className="leading-relaxed text-lg" style={{ color: "#2D2D2D" }}>{bullet}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {notes.keyTerms.length > 0 && (
              <div className="w-full md:w-80 shrink-0 space-y-4 sticky top-8">
                <h3 className="text-sm font-bold uppercase tracking-widest px-2" style={{ color: "#6B6B6B" }}>Glossary</h3>
                <div className="space-y-4">
                  {notes.keyTerms.map((kt, idx) => (
                    <div key={idx} className="lg-subtle p-5 rounded-xl">
                      <h4 className="font-serif font-bold mb-2 text-lg" style={{ color: "#FF9F4C" }}>{kt.term}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{kt.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-center gap-4 pt-8 pb-20" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <button 
              onClick={reset}
              className="lg-button-outline px-6 py-3 font-bold rounded-xl transition-colors"
            >
              Generate New Notes
            </button>
            <button 
              onClick={downloadNotes}
              className="lg-button px-6 py-3 font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <Download size={18} />
              Download Notes
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
