import { useState } from "react";
import { useGenerateStudyNotes } from "@workspace/api-client-react";
import { ClipboardList, Download, Book } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";

export default function StudyNotes() {
  const [topic, setTopic] = useState("");
  const generateNotes = useGenerateStudyNotes();
  const notes = generateNotes.data;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
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
        <form onSubmit={handleSubmit} className="animate-fade-in-up glass-card rounded-2xl p-8 max-w-2xl mx-auto mt-12 border-t-4 border-t-primary">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Subject or Chapter
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Chapter 4: Introduction to Quantum Mechanics..."
                className="w-full bg-background border border-input rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-lg resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!topic.trim()}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md mt-4"
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
          
          <div className="bg-card border-l-8 border-l-primary border border-card-border p-8 md:p-12 rounded-2xl shadow-sm">
            <h2 className="text-4xl md:text-5xl font-serif text-foreground font-bold mb-4">
              {notes.title}
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-foreground text-sm font-bold uppercase tracking-widest rounded-md">
              <Book size={14} /> Review Material
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            <div className="flex-1 space-y-8">
              {notes.sections.map((section, idx) => (
                <section key={idx} className="bg-card border border-card-border p-8 rounded-2xl">
                  <h3 className="text-2xl font-serif text-foreground font-bold mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                      {idx + 1}
                    </span>
                    {section.heading}
                  </h3>
                  <ul className="space-y-4">
                    {section.bullets.map((bullet, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-2.5" />
                        <p className="text-foreground/80 leading-relaxed text-lg">{bullet}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {notes.keyTerms.length > 0 && (
              <div className="w-full md:w-80 shrink-0 space-y-4 sticky top-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">Glossary</h3>
                <div className="space-y-4">
                  {notes.keyTerms.map((kt, idx) => (
                    <div key={idx} className="bg-secondary/50 p-5 rounded-xl border border-border">
                      <h4 className="font-serif font-bold text-foreground mb-2 text-lg">{kt.term}</h4>
                      <p className="text-sm text-foreground/70 leading-relaxed">{kt.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-center gap-4 pt-8 pb-20 border-t border-border">
            <button 
              onClick={reset}
              className="px-6 py-3 border-2 border-input bg-background hover:bg-muted text-foreground font-bold rounded-xl transition-colors"
            >
              Generate New Notes
            </button>
            <button 
              onClick={downloadNotes}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
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
