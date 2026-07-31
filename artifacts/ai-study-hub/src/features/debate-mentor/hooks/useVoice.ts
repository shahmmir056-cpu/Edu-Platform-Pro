import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  autoRestart?: boolean;
  ttsEndpoint?: string;
}

const DEFAULT_TTS_ENDPOINT = "/api/tts";

export function useVoice({ onTranscript, autoRestart = false, ttsEndpoint }: UseVoiceOptions = {}) {
  const ttsUrl = ttsEndpoint || DEFAULT_TTS_ENDPOINT;
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
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

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
    if (synthRef.current) {
      window.speechSynthesis?.cancel();
      synthRef.current = null;
    }
    setIsSpeaking(false);
  }

  let bestVoiceRef: SpeechSynthesisVoice | null = null;
  let voiceLoadAttempted = false;

  function getBestVoice(): SpeechSynthesisVoice | null {
    if (bestVoiceRef) return bestVoiceRef;
    const voices = window.speechSynthesis?.getVoices() ?? [];
    if (voices.length === 0) return null;
    const preferred = [
      "Google UK English Female", "Google UK English Male", "Google US English",
      "Microsoft Zira", "Microsoft David", "Microsoft Linda",
      "Samantha", "Karen", "Moira", "Tessa", "Fiona", "Kate",
    ];
    for (const name of preferred) {
      const found = voices.find((v) => v.name.includes(name) && v.localService === false);
      if (found) { bestVoiceRef = found; return found; }
    }
    for (const name of preferred) {
      const found = voices.find((v) => v.name.includes(name));
      if (found) { bestVoiceRef = found; return found; }
    }
    bestVoiceRef = voices[0];
    return bestVoiceRef;
  }

  function fallbackSpeak(text: string, gen: number) {
    if (!window.speechSynthesis) {
      setIsSpeaking(false);
      skipNextAutoRef.current = false;
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const best = getBestVoice();
    if (best) utterance.voice = best;
    synthRef.current = utterance;
    utterance.onend = () => { finishFallback(); };
    utterance.onerror = () => { finishFallback(); };
    window.speechSynthesis.speak(utterance);
    function finishFallback() {
      if (gen !== speakGenRef.current) return;
      if (synthRef.current === utterance) synthRef.current = null;
      setIsSpeaking(false);
      skipNextAutoRef.current = false;
      if (autoRestartRef.current && recognitionRef.current) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); setIsListening(true); setTranscript(""); } catch {}
        }, 400);
      }
    }
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

  // Preload speech voices on mount (Chrome loads them async)
  useEffect(() => {
    if (!window.speechSynthesis) return;
    if (!voiceLoadAttempted) {
      voiceLoadAttempted = true;
      window.speechSynthesis.getVoices();
    }
    const onVoices = () => { bestVoiceRef = null; getBestVoice(); };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
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
      const res = await fetch(ttsUrl, {
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
      console.warn("Kokoro TTS error, falling back to browser speech:", err.message);
      fallbackSpeak(trimmed, gen);
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
