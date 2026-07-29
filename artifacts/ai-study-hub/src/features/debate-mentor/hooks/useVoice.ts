import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  autoRestart?: boolean;
}

export function useVoice({ onTranscript, autoRestart = false }: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const autoRestartRef = useRef(autoRestart);
  const skipNextAutoRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

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
              synthRef.current?.cancel();
              recognition.start();
              setIsListening(true);
              setTranscript("");
            } catch {}
          }, 300);
        }
      };

      recognitionRef.current = recognition;
    }

    synthRef.current = window.speechSynthesis || null;

    if (synthRef.current) {
      const loadVoices = () => {
        voicesRef.current = synthRef.current?.getVoices() || [];
      };
      loadVoices();
      synthRef.current.addEventListener("voiceschanged", loadVoices);
    }

    return () => {
      skipNextAutoRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    skipNextAutoRef.current = false;
    try {
      synthRef.current?.cancel();
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

  const speakRateRef = useRef(1.0);

  const getPreferredVoice = useCallback(() => {
    const voices = voicesRef.current.length > 0
      ? voicesRef.current
      : (synthRef.current?.getVoices() || []);
    return voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en"))
      || voices.find((v) => v.lang.startsWith("en") && v.localService === false)
      || voices.find((v) => v.lang.startsWith("en"))
      || voices[0]
      || null;
  }, []);

  const speak = useCallback((text: string, rate?: number) => {
    return new Promise<void>((resolve) => {
      if (!synthRef.current) { resolve(); return; }

      skipNextAutoRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        setIsListening(false);
      }

      const doSpeak = () => {
        if (!synthRef.current) { resolve(); return; }
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate ?? speakRateRef.current;
        utterance.pitch = 1.0;
        utterance.lang = "en-US";

        const voice = getPreferredVoice();
        if (voice) utterance.voice = voice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
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
          resolve();
        };
        utterance.onerror = (e) => {
          console.warn("Speech synthesis error:", e.error);
          setIsSpeaking(false);
          skipNextAutoRef.current = false;
          resolve();
        };
        synthRef.current.speak(utterance);
      };

      setTimeout(doSpeak, 80);
    });
  }, [getPreferredVoice]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    skipNextAutoRef.current = false;
  }, []);

  const setSpeakRate = useCallback((rate: number) => {
    speakRateRef.current = rate;
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
