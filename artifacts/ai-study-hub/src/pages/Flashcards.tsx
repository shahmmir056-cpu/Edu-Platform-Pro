import { useState } from "react";
import { useGenerateFlashcards } from "@workspace/api-client-react";
import { Layers, ArrowRight, ArrowLeft, RotateCw } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils";

export default function Flashcards() {
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(10);
  const generateFlashcards = useGenerateFlashcards();
  const deck = generateFlashcards.data;

  // Deck interactive state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    generateFlashcards.mutate({ data: { topic, numCards } });
    setCurrentCardIdx(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (deck && currentCardIdx < deck.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIdx(prev => prev + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentCardIdx > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIdx(prev => prev - 1), 150);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-[calc(100vh-4rem)] flex flex-col">
      <ToolHeader 
        title="Flashcard Deck" 
        description="Instantly create flippable flashcards for rapid memorization."
        icon={Layers}
      />

      {!generateFlashcards.isPending && !deck && !generateFlashcards.isError && (
        <form onSubmit={handleSubmit} className="animate-fade-in-up glass-card rounded-2xl p-8 max-w-xl mx-auto mt-12 border-t-4 border-t-accent">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Vocabulary Topic
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Medical Terminology, Spanish Verbs..."
                className="w-full bg-background border border-input rounded-xl p-4 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all text-lg"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Number of Cards
                </label>
                <span className="text-sm font-mono font-bold text-accent">{numCards} cards</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={numCards}
                onChange={(e) => setNumCards(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            <button
              type="submit"
              disabled={!topic.trim()}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md mt-4"
            >
              <Layers size={20} />
              Generate Deck
            </button>
          </div>
        </form>
      )}

      {generateFlashcards.isPending && (
        <LoadingState 
          title="Generating Deck..." 
          messages={["Extracting key concepts...", "Creating concise pairs...", "Formatting cards..."]} 
        />
      )}

      {generateFlashcards.isError && (
        <ErrorState onRetry={() => handleSubmit()} />
      )}

      {deck && !generateFlashcards.isPending && (
        <div className="flex-1 flex flex-col justify-center animate-fade-in-up max-w-3xl mx-auto w-full pb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif text-foreground font-bold mb-2">{deck.title}</h2>
            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-secondary rounded-full text-sm font-bold font-mono text-foreground tracking-widest">
              CARD {currentCardIdx + 1} / {deck.cards.length}
            </div>
          </div>

          {/* Perspective container for 3D flip effect */}
          <div className="relative w-full aspect-[3/2] md:aspect-[2/1] perspective-1000 mb-10 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={cn(
              "w-full h-full relative preserve-3d transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl rounded-3xl",
              isFlipped ? "rotate-y-180" : ""
            )}>
              
              {/* Front of card */}
              <div className="absolute inset-0 backface-hidden bg-card border-2 border-card-border rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center">
                <div className="absolute top-6 left-6 text-muted-foreground/40 font-bold uppercase tracking-widest text-xs">Term</div>
                <h3 className="text-3xl md:text-5xl font-serif text-foreground leading-tight">
                  {deck.cards[currentCardIdx].front}
                </h3>
                <div className="absolute bottom-6 right-6 text-primary/40 flex items-center gap-2 text-sm font-bold uppercase">
                  Flip <RotateCw size={14} />
                </div>
              </div>

              {/* Back of card */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary border-2 border-primary-border rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center">
                <div className="absolute top-6 left-6 text-primary-foreground/50 font-bold uppercase tracking-widest text-xs">Definition</div>
                <p className="text-xl md:text-2xl text-primary-foreground leading-relaxed">
                  {deck.cards[currentCardIdx].back}
                </p>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={prevCard}
              disabled={currentCardIdx === 0}
              className="p-4 rounded-full bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-30 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <button 
              onClick={() => {
                generateFlashcards.reset();
                setTopic("");
              }}
              className="px-6 py-4 border-2 border-input font-bold rounded-xl text-foreground hover:bg-muted transition-colors mx-4"
            >
              New Deck
            </button>
            <button 
              onClick={nextCard}
              disabled={currentCardIdx === deck.cards.length - 1}
              className="p-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-colors shadow-md"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


