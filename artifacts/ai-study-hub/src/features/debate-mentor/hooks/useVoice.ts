import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  autoRestart?: boolean;
}

const TTS_ENDPOINT = "/api/tts";

export function useVoice({ onTranscript, autoRestart = false }: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const autoRestartRef = useRef(autoRestart);
  const skipNextAutoRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const speakGenRef = useRef(0);
  const currentAbortRef = useRef<AbortController | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    autoRestartRef.current = autoRestart;
  }, [autoRestart]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  function cancelCurrentSpeak() {
    if (currentAbortRef.current) {
      currentAbortRef.current.abort();
      currentAbortRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t;
          } else {
            interimTranscript += t;
          }
        }
        setTranscript(interimTranscript || finalTranscript);
        if (finalTranscript) {
          onTranscriptRef.current?.(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (autoRestartRef.current && !skipNextAutoRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
              setIsListening(true);
              setTranscript("");
            } catch {}
          }, 300);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      skipNextAutoRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      cancelCurrentSpeak();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    skipNextAutoRef.current = false;
    try {
      cancelCurrentSpeak();
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript("");
    } catch {}
  }, []);

  const stopListening = useCallback(() => {
    skipNextAutoRef.current = true;
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setIsListening(false);
  }, []);

  const speak = useCallback(async (text: string, voice?: string) => {
    const trimmed = text?.trim() ?? "";
    if (!trimmed) return;

    cancelCurrentSpeak();
    skipNextAutoRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }

    const gen = ++speakGenRef.current;
    setIsSpeaking(true);

    const controller = new AbortController();
    currentAbortRef.current = controller;

    try {
      const res = await fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, voice }),
        signal: controller.signal,
      });

      if (gen !== speakGenRef.current) return;

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "TTS failed" }));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();

      if (gen !== speakGenRef.current) return;

      // Fetch done; no longer need the abort controller for cancellation.
      if (currentAbortRef.current === controller) {
        currentAbortRef.current = null;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          finish();
          resolve();
        };
        audio.onerror = () => {
          finish();
          resolve();
        };

        audio.play().catch((playErr) => {
          finish();
          console.warn("Audio playback error:", playErr.message);
          resolve();
        });

        function finish() {
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          skipNextAutoRef.current = false;
          if (autoRestartRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
                setIsListening(true);
                setTranscript("");
              } catch {}
            }, 400);
          }
        }
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.warn("Kokoro TTS error:", err.message);
      setIsSpeaking(false);
      skipNextAutoRef.current = false;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    cancelCurrentSpeak();
    skipNextAutoRef.current = false;
  }, []);

  const setSpeakRate = useCallback((_rate: number) => {
    // Kokoro speed can be configured via env; no runtime rate control for now
  }, []);

  const startAutoConversation = useCallback(() => {
    autoRestartRef.current = true;
    skipNextAutoRef.current = false;
    if (!isListening && !isSpeaking) {
      startListening();
    }
  }, [isListening, isSpeaking, startListening]);

  const stopAutoConversation = useCallback(() => {
    autoRestartRef.current = false;
    skipNextAutoRef.current = true;
    stopListening();
    stopSpeaking();
  }, [stopListening, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    transcript,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setSpeakRate,
    startAutoConversation,
    stopAutoConversation,
  };
}
