import { useState } from "react";
import { useGenerateFlashcards } from "@workspace/api-client-react";
import { Layers, ArrowRight, ArrowLeft, RotateCw } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { trackAction } from "@/features/life-os/tracker";
import { cn } from "@/lib/utils";

export default function Flashcards() {
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(10);
  const generateFlashcards = useGenerateFlashcards();
  const deck = generateFlashcards.data;

  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    generateFlashcards.mutate({ data: { topic, numCards } });
    trackAction("/flashcards", "deck-created", topic, 1, topic.trim(), `Deck with ${numCards} cards`);
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
        <form onSubmit={handleSubmit} className="animate-fade-in-up lg-card rounded-2xl p-8 max-w-xl mx-auto mt-12 border-t-4 border-t-accent">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                Vocabulary Topic
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Medical Terminology, Spanish Verbs..."
                className="lg-input w-full rounded-xl p-4 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all text-lg"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
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
              className="lg-button w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md mt-4"
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
            <h2 className="text-xl sm:text-2xl font-serif font-bold mb-2" style={{ color: "#FF9F4C" }}>{deck.title}</h2>
            <div className="inline-flex items-center justify-center px-4 py-1.5 lg-badge rounded-full text-sm font-bold font-mono tracking-widest" style={{ color: "#FF9F4C" }}>
              CARD {currentCardIdx + 1} / {deck.cards.length}
            </div>
          </div>

          {/* Perspective container for 3D flip effect */}
          <div className="relative w-full aspect-[3/2] md:aspect-[2/1] perspective-1000 mb-10 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={cn(
              "w-full h-full relative preserve-3d transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-3xl",
              isFlipped ? "rotate-y-180" : ""
            )}
              style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.04)" }}
            >
              
              {/* Front of card */}
              <div className="absolute inset-0 backface-hidden rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center lg-card border-2"
                style={{ borderColor: "rgba(255,255,255,0.5)" }}
              >
                <div className="absolute top-6 left-6 font-bold uppercase tracking-widest text-xs" style={{ color: "#9A9A9A" }}>Term</div>
                <h3 className="text-3xl md:text-5xl font-serif leading-tight" style={{ color: "#FF9F4C" }}>
                  {deck.cards[currentCardIdx].front}
                </h3>
                <div className="absolute bottom-6 right-6 text-primary/40 flex items-center gap-2 text-sm font-bold uppercase">
                  Flip <RotateCw size={14} />
                </div>
              </div>

              {/* Back of card */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center border-2 border-primary"
                style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}
              >
                <div className="absolute top-6 left-6 font-bold uppercase tracking-widest text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Definition</div>
                <p className="text-xl md:text-2xl leading-relaxed" style={{ color: "#ffffff" }}>
                  {deck.cards[currentCardIdx].back}
                </p>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={prevCard}
              disabled={currentCardIdx === 0}
              className="lg-button-outline p-4 rounded-full disabled:opacity-30 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <button 
              onClick={() => {
                generateFlashcards.reset();
                setTopic("");
              }}
              className="lg-button-outline px-6 py-4 font-bold rounded-xl transition-colors mx-4"
            >
              New Deck
            </button>
            <button 
              onClick={nextCard}
              disabled={currentCardIdx === deck.cards.length - 1}
              className="lg-button p-4 rounded-full disabled:opacity-30 transition-colors shadow-md"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
