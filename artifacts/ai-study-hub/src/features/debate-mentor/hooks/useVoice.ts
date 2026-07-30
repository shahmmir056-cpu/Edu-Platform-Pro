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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSourceRef = useRef<string | null>(null);
  const autoRestartRef = useRef(autoRestart);
  const skipNextAutoRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const speakResolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    autoRestartRef.current = autoRestart;
  }, [autoRestart]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

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
              cancelAudio();
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
      cancelAudio();
    };
  }, []);

  function cancelAudio() {
    if (currentSourceRef.current) {
      URL.revokeObjectURL(currentSourceRef.current);
      currentSourceRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (speakResolveRef.current) {
      speakResolveRef.current();
      speakResolveRef.current = null;
    }
    setIsSpeaking(false);
  }

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    skipNextAutoRef.current = false;
    try {
      cancelAudio();
      setIsSpeaking(false);
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
    return new Promise<void>((resolve) => {
      cancelAudio();
      skipNextAutoRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        setIsListening(false);
      }
      if (!text.trim()) { resolve(); return; }

      speakResolveRef.current = resolve;
      setIsSpeaking(true);

      const controller = new AbortController();

      fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), voice }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "TTS failed" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          currentSourceRef.current = url;

          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            setIsSpeaking(false);
            if (currentSourceRef.current) {
              URL.revokeObjectURL(currentSourceRef.current);
              currentSourceRef.current = null;
            }
            audioRef.current = null;
            speakResolveRef.current = null;
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
            resolve();
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            if (currentSourceRef.current) {
              URL.revokeObjectURL(currentSourceRef.current);
              currentSourceRef.current = null;
            }
            audioRef.current = null;
            speakResolveRef.current = null;
            skipNextAutoRef.current = false;
            resolve();
          };

          await audio.play();
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          console.warn("Kokoro TTS error:", err.message);
          setIsSpeaking(false);
          speakResolveRef.current = null;
          skipNextAutoRef.current = false;
          resolve();
        });
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    cancelAudio();
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
