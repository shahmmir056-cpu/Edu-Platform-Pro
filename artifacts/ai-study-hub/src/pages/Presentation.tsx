import { useState } from "react";
import { useGeneratePresentation } from "@workspace/api-client-react";
import { MonitorPlay, Download, ChevronRight, ChevronLeft, LayoutTemplate } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils";

export default function Presentation() {
  const [topic, setTopic] = useState("");
  const [numSlides, setNumSlides] = useState(10);
  
  const generatePres = useGeneratePresentation();
  const presentation = generatePres.data;

  // Deck viewer state
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    generatePres.mutate({ data: { topic, numSlides } });
    setCurrentSlide(0);
  };

  const nextSlide = () => {
    if (presentation && currentSlide < presentation.slides.length - 1) {
      setCurrentSlide(s => s + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(s => s - 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 min-h-[calc(100vh-4rem)] flex flex-col">
      <ToolHeader 
        title="Presentation Outline" 
        description="Generate slide-by-slide outlines complete with speaker notes."
        icon={MonitorPlay}
      />

      {!generatePres.isPending && !presentation && !generatePres.isError && (
        <form onSubmit={handleSubmit} className="animate-fade-in-up glass-card rounded-2xl p-8 max-w-xl mx-auto mt-12 border-t-4 border-t-primary">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Presentation Topic
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The Future of Renewable Energy..."
                className="w-full bg-background border border-input rounded-xl p-4 focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-lg"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Number of Slides
                </label>
                <span className="text-sm font-mono font-bold text-primary">{numSlides} slides</span>
              </div>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={numSlides}
                onChange={(e) => setNumSlides(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <button
              type="submit"
              disabled={!topic.trim()}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md mt-4"
            >
              <LayoutTemplate size={20} />
              Generate Deck
            </button>
          </div>
        </form>
      )}

      {generatePres.isPending && (
        <LoadingState 
          title="Building Deck..." 
          messages={["Structuring narrative arc...", "Drafting slide titles...", "Creating bullet points...", "Writing speaker notes..."]} 
        />
      )}

      {generatePres.isError && (
        <ErrorState onRetry={() => handleSubmit()} />
      )}

      {presentation && !generatePres.isPending && (
        <div className="flex-1 flex flex-col animate-fade-in-up pb-20">
          
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-foreground">{presentation.title}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => {generatePres.reset(); setTopic("");}} className="text-sm font-bold text-muted-foreground hover:text-foreground">New</button>
              <span className="text-muted-foreground mx-2">|</span>
              <button className="text-sm font-bold text-primary flex items-center gap-1"><Download size={14}/> Export</button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 h-full max-h-[800px]">
            
            {/* Visual Slide Area */}
            <div className="flex-1 flex flex-col relative group">
              <div className="flex-1 bg-white border border-border shadow-lg rounded-xl overflow-hidden flex flex-col p-10 md:p-16 aspect-video">
                <div className="mb-auto">
                  <h3 className={cn(
                    "font-serif font-bold text-slate-900 leading-tight mb-8",
                    currentSlide === 0 ? "text-5xl md:text-6xl text-center mt-12" : "text-4xl pb-6 border-b-2 border-primary/10"
                  )}>
                    {presentation.slides[currentSlide].title}
                  </h3>
                  
                  {currentSlide !== 0 && (
                    <ul className="space-y-6">
                      {presentation.slides[currentSlide].bullets.map((bullet, i) => (
                        <li key={i} className="flex gap-4 text-xl text-slate-700 leading-relaxed">
                          <span className="text-primary font-bold mt-1">•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="mt-auto text-sm text-slate-400 font-mono flex justify-between">
                  <span>{presentation.title}</span>
                  <span>{currentSlide + 1}</span>
                </div>
              </div>

              {/* Navigation Overlay */}
              <button 
                onClick={prevSlide} disabled={currentSlide === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/10 backdrop-blur text-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:hidden hover:bg-black/20 hover:text-black"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextSlide} disabled={currentSlide === presentation.slides.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/10 backdrop-blur text-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:hidden hover:bg-black/20 hover:text-black"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Speaker Notes Area */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col bg-card border border-card-border rounded-xl shadow-sm overflow-hidden h-[400px] lg:h-auto">
              <div className="p-4 bg-secondary/50 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">Speaker Notes</span>
                <span className="text-xs font-mono text-muted-foreground px-2 py-1 bg-background rounded">Slide {currentSlide + 1}</span>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-foreground/80 leading-relaxed">
                  {presentation.slides[currentSlide].speakerNotes}
                </p>
              </div>
            </div>

          </div>
          
          {/* Thumbnails */}
          <div className="mt-8 flex gap-3 overflow-x-auto pb-4 pt-2 snap-x">
            {presentation.slides.map((slide, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "shrink-0 w-40 aspect-video rounded-lg border-2 p-3 text-left overflow-hidden snap-start transition-all",
                  idx === currentSlide 
                    ? "border-primary ring-4 ring-primary/20 bg-white" 
                    : "border-input bg-card hover:border-primary/30 opacity-60 hover:opacity-100"
                )}
              >
                <div className="text-xs font-serif font-bold text-slate-900 truncate mb-1">
                  {slide.title}
                </div>
                {idx !== 0 && (
                  <div className="w-1/2 h-1 bg-slate-200 rounded mb-1" />
                )}
                {idx !== 0 && (
                  <div className="w-3/4 h-1 bg-slate-200 rounded" />
                )}
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
