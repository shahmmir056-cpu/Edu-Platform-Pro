import { useState } from "react";
import { useGenerateQuiz } from "@workspace/api-client-react";
import { HelpCircle, CheckCircle2, XCircle, RefreshCw, Trophy } from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils";

type Difficulty = "easy" | "medium" | "hard";

export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const generateQuiz = useGenerateQuiz();
  const quiz = generateQuiz.data;

  // Quiz interactive state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    generateQuiz.mutate({ data: { topic, numQuestions, difficulty } });
    // Reset interactive state
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const reset = () => {
    generateQuiz.reset();
    setTopic("");
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (optionIdx: number) => {
    if (showResults) return; // Prevent changing after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: optionIdx
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const score = Object.entries(selectedAnswers).reduce((total, [qIdx, aIdx]) => {
    return total + (quiz?.questions[Number(qIdx)].correctIndex === aIdx ? 1 : 0);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <ToolHeader 
        title="Quiz Generator" 
        description="Test your knowledge with interactive multiple-choice quizzes."
        icon={HelpCircle}
      />

      {!generateQuiz.isPending && !quiz && !generateQuiz.isError && (
        <form onSubmit={handleSubmit} className="animate-fade-in-up glass-card rounded-2xl p-8 max-w-xl mx-auto mt-12 border-t-4 border-t-primary">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                What do you want to be tested on?
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Cellular respiration, World War II..."
                className="w-full bg-background border border-input rounded-xl p-4 focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full bg-background border border-input rounded-xl p-3.5 focus:ring-2 focus:ring-ring outline-none"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-background border border-input rounded-xl p-3.5 focus:ring-2 focus:ring-ring outline-none capitalize"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!topic.trim()}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md mt-4"
            >
              <HelpCircle size={20} />
              Generate Quiz
            </button>
          </div>
        </form>
      )}

      {generateQuiz.isPending && (
        <LoadingState 
          title="Crafting Questions..." 
          messages={[
            "Formulating questions...",
            "Generating plausible distractors...",
            "Writing explanations...",
            "Calibrating difficulty..."
          ]} 
        />
      )}

      {generateQuiz.isError && (
        <ErrorState onRetry={() => handleSubmit()} />
      )}

      {quiz && !generateQuiz.isPending && !showResults && (
        <div className="animate-fade-in-up max-w-2xl mx-auto mt-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-serif text-foreground font-bold">{quiz.title}</h2>
            <div className="px-3 py-1 bg-secondary rounded-full text-sm font-mono font-bold text-foreground">
              {currentQuestionIdx + 1} / {quiz.questions.length}
            </div>
          </div>

          <div className="bg-card border border-card-border p-8 rounded-2xl shadow-sm mb-8">
            <h3 className="text-2xl font-serif text-foreground mb-8 leading-snug">
              {quiz.questions[currentQuestionIdx].question}
            </h3>

            <div className="space-y-3">
              {quiz.questions[currentQuestionIdx].options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestionIdx] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={cn(
                      "w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4 group",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-input bg-background hover:border-primary/40 hover:bg-accent/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-sm transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground group-hover:bg-primary/20"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={cn("text-lg", isSelected ? "text-foreground font-medium" : "text-foreground/80")}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={nextQuestion}
              disabled={selectedAnswers[currentQuestionIdx] === undefined}
              className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {currentQuestionIdx === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
            </button>
          </div>
        </div>
      )}

      {quiz && showResults && (
        <div className="animate-fade-in-up max-w-3xl mx-auto mt-8">
          <div className="text-center mb-12 p-10 bg-card border border-card-border rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
            <Trophy className="w-16 h-16 text-accent mx-auto mb-4 relative z-10" />
            <h2 className="text-3xl font-serif text-foreground mb-2 relative z-10">Quiz Completed!</h2>
            <p className="text-muted-foreground text-lg mb-6 relative z-10">You scored</p>
            <div className="text-7xl font-mono font-bold text-primary relative z-10">
              {score}<span className="text-4xl text-primary/50">/{quiz.questions.length}</span>
            </div>
            <div className={cn(
              "text-sm font-bold uppercase tracking-widest mt-4 relative z-10",
              score === quiz.questions.length ? "text-green-600" : 
              score >= quiz.questions.length * 0.7 ? "text-primary" : "text-muted-foreground"
            )}>
              {Math.round((score / quiz.questions.length) * 100)}% Accuracy
              {score === quiz.questions.length && " — Perfect Score!"}
              {score !== quiz.questions.length && score >= quiz.questions.length * 0.7 && " — Great Job!"}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-serif text-foreground mb-6">Detailed Review</h3>
            {quiz.questions.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const isCorrect = userAnswer === q.correctIndex;
              
              return (
                <div key={idx} className={cn(
                  "p-6 rounded-2xl border-l-4",
                  isCorrect ? "bg-primary/5 border-primary" : "bg-destructive/5 border-destructive"
                )}>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <XCircle className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-lg font-bold text-foreground mb-4">
                        {idx + 1}. {q.question}
                      </h4>
                      
                      <div className="space-y-2 mb-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={cn(
                            "px-4 py-2 rounded-lg text-sm flex items-center justify-between",
                            oIdx === q.correctIndex 
                              ? "bg-primary/10 text-primary font-medium border border-primary/20" 
                              : oIdx === userAnswer 
                                ? "bg-destructive/10 text-destructive font-medium border border-destructive/20"
                                : "text-muted-foreground"
                          )}>
                            <span>{opt}</span>
                            {oIdx === q.correctIndex && <span className="text-xs uppercase tracking-widest font-bold">Correct</span>}
                            {oIdx === userAnswer && !isCorrect && <span className="text-xs uppercase tracking-widest font-bold">Your Answer</span>}
                          </div>
                        ))}
                      </div>

                      <div className="bg-primary/5 p-4 rounded-xl text-sm text-foreground/80 mt-4 border border-border/50">
                        <span className="font-bold text-foreground uppercase text-xs tracking-wider mb-1 block">Explanation</span>
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-12 pb-20">
            <button 
              onClick={reset}
              className="px-6 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Create Another Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
