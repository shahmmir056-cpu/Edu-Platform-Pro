import { useRef, useState, useCallback, useEffect } from "react";
import { HandLandmarker, FilesetResolver, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Gesture, GestureState } from "./GestureTypes";
import { GESTURE_COOLDOWN_MS, FIST_HOLD_MS, SCROLL_SPEED, SWIPE_THRESHOLD, MOTION_THRESHOLD, PINCH_DISTANCE, OK_DISTANCE, WAVE_WINDOW_MS, WAVE_DIRECTION_CHANGES } from "./GestureTypes";

type Landmarks = NormalizedLandmark[];

function isFingerExtended(lm: Landmarks, tip: number, pip: number, mcp: number): boolean {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 };
const MCP = { thumb: 2, index: 5, middle: 9, ring: 13, pinky: 17 };

function detectGesture(lm: Landmarks, prevY: number | null): { gesture: Gesture; confidence: number } {
  const indexExt = isFingerExtended(lm, TIP.index, PIP.index, MCP.index);
  const middleExt = isFingerExtended(lm, TIP.middle, PIP.middle, MCP.middle);
  const ringExt = isFingerExtended(lm, TIP.ring, PIP.ring, MCP.ring);
  const pinkyExt = isFingerExtended(lm, TIP.pinky, PIP.pinky, MCP.pinky);
  // Hand-agnostic thumb detection: thumb extended if tip is further from palm center than MCP
  const palmCenterX = (lm[0].x + lm[5].x + lm[17].x) / 3;
  const palmCenterY = (lm[0].y + lm[5].y + lm[17].y) / 3;
  const tipDist = Math.sqrt((lm[TIP.thumb].x - palmCenterX) ** 2 + (lm[TIP.thumb].y - palmCenterY) ** 2);
  const mcpDist = Math.sqrt((lm[MCP.thumb].x - palmCenterX) ** 2 + (lm[MCP.thumb].y - palmCenterY) ** 2);
  const thumbExt = tipDist > mcpDist;

  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  const thumbIndexDist = distance(lm[TIP.thumb], lm[TIP.index]);

  // ------ Static poses (highest confidence, checked first) ------

  // Thumbs up: thumb extended, all others closed
  if (thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: "thumbs_up", confidence: 0.9 };
  }

  // OK sign: thumb-tip near index-tip, other three fingers extended
  if (thumbIndexDist < OK_DISTANCE && middleExt && ringExt && pinkyExt) {
    return { gesture: "ok_sign", confidence: 0.85 };
  }

  // Victory: index + middle extended, ring + pinky closed
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return { gesture: "victory", confidence: 0.85 };
  }

  // Three: index + middle + ring extended, pinky closed
  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return { gesture: "three", confidence: 0.8 };
  }

  // Index point: index extended, others closed
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: "index_point", confidence: 0.85 };
  }

  // Pinch: thumb-tip very close to index-tip (distance < tight threshold)
  if (thumbIndexDist < PINCH_DISTANCE) {
    return { gesture: "pinch", confidence: 0.8 };
  }

  // Open palm: all four fingers extended
  if (extendedCount >= 4) {
    return { gesture: "palm_stop", confidence: 0.8 };
  }

  // Fist: no fingers extended
  if (!indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExt) {
    return { gesture: "fist_hold", confidence: 0.85 };
  }

  // ------ Motion-based (lower confidence) ------

  if (prevY !== null) {
    const dy = lm[0].y - prevY;
    if (dy < -MOTION_THRESHOLD / 1000) return { gesture: "scroll_up", confidence: 0.7 };
    if (dy > MOTION_THRESHOLD / 1000) return { gesture: "scroll_down", confidence: 0.7 };
  }

  return { gesture: "none", confidence: 0 };
}

export function useHandGesture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastGestureRef = useRef<{ gesture: Gesture; time: number }>({ gesture: "none", time: 0 });
  const fistStartRef = useRef<number>(0);
  const prevWristYRef = useRef<number | null>(null);
  const prevWristXRef = useRef<number | null>(null);
  const wavePrevWristXRef = useRef<number | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);
  const waveDirHistoryRef = useRef<{ dir: number; time: number }[]>([]);
  const lastWaveTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<GestureState>({
    enabled: false,
    activeGesture: "none",
    confidence: 0,
    fps: 0,
    handDetected: false,
    cameraReady: false,
    error: null,
  });

  const callbacksRef = useRef<{
    onScrollUp?: () => void;
    onScrollDown?: () => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onThumbsUp?: () => void;
    onVictory?: () => void;
    onDisable?: () => void;
    onPalmStop?: () => void;
    onIndexPoint?: () => void;
    onOkSign?: () => void;
    onPinch?: () => void;
    onThree?: () => void;
    onWave?: () => void;
  }>({});

  const registerCallbacks = useCallback((cbs: typeof callbacksRef.current) => {
    callbacksRef.current = cbs;
  }, []);

  const detectSwipe = useCallback((lm: Landmarks) => {
    const now = Date.now();
    if (now - lastSwipeTimeRef.current < GESTURE_COOLDOWN_MS * 1.5) return null;
    const wristX = lm[0].x;
    if (prevWristXRef.current !== null) {
      const dx = (wristX - prevWristXRef.current) * 1000;
      if (Math.abs(dx) > SWIPE_THRESHOLD / 10) {
        lastSwipeTimeRef.current = now;
        prevWristXRef.current = wristX;
        return dx > 0 ? "swipe_right" : "swipe_left";
      }
    }
    prevWristXRef.current = wristX;
    return null;
  }, []);

  const detectWave = useCallback((lm: Landmarks) => {
    const now = Date.now();
    if (now - lastWaveTimeRef.current < WAVE_WINDOW_MS * 2) return false;
    const wristX = lm[0].x;
    if (wavePrevWristXRef.current !== null) {
      const dx = wristX - wavePrevWristXRef.current;
      wavePrevWristXRef.current = wristX;
      if (Math.abs(dx) > 0.005) {
        const dir = dx > 0 ? 1 : -1;
        waveDirHistoryRef.current.push({ dir, time: now });
        waveDirHistoryRef.current = waveDirHistoryRef.current.filter(e => now - e.time < WAVE_WINDOW_MS);
        let changes = 0;
        for (let i = 1; i < waveDirHistoryRef.current.length; i++) {
          if (waveDirHistoryRef.current[i].dir !== waveDirHistoryRef.current[i - 1].dir) {
            changes++;
          }
        }
        if (changes >= WAVE_DIRECTION_CHANGES) {
          waveDirHistoryRef.current = [];
          lastWaveTimeRef.current = now;
          return true;
        }
      }
    } else {
      wavePrevWristXRef.current = wristX;
    }
    return false;
  }, []);

  const processFrame = useCallback((now: number) => {
    if (!handLandmarkerRef.current || !videoRef.current) return;
    const results = handLandmarkerRef.current.detectForVideo(videoRef.current, now);
    const fps = Math.round(handLandmarkerRef.current.getFps());

    if (results.landmarks && results.landmarks.length > 0) {
      const lm = results.landmarks[0];
      const wristY = lm[0].y;

      const { gesture, confidence } = detectGesture(lm, prevWristYRef.current);
      const swipe = detectSwipe(lm);
      const wave = detectWave(lm);

      let finalGesture: Gesture = gesture;
      let finalConfidence = confidence;

      if (swipe) { finalGesture = swipe; finalConfidence = 0.8; }
      else if (wave) { finalGesture = "wave"; finalConfidence = 0.75; }

      prevWristYRef.current = wristY;

      // Cooldown check
      const nowMs = Date.now();
      const isGestureChange = finalGesture !== lastGestureRef.current.gesture;
      const cooldownOk = nowMs - lastGestureRef.current.time > GESTURE_COOLDOWN_MS;

      if (finalGesture === "fist_hold") {
        if (fistStartRef.current === 0) fistStartRef.current = nowMs;
        if (nowMs - fistStartRef.current >= FIST_HOLD_MS) {
          callbacksRef.current.onDisable?.();
          fistStartRef.current = 0;
          setState(s => ({ ...s, enabled: false, activeGesture: "none" }));
          return;
        }
      } else {
        fistStartRef.current = 0;
      }

      if (cooldownOk && (isGestureChange || finalGesture === "scroll_up" || finalGesture === "scroll_down")) {
        lastGestureRef.current = { gesture: finalGesture, time: nowMs };
        setState(s => ({ ...s, activeGesture: finalGesture, confidence: finalConfidence, handDetected: true, fps }));

        if (finalGesture === "scroll_up") callbacksRef.current.onScrollUp?.();
        else if (finalGesture === "scroll_down") callbacksRef.current.onScrollDown?.();
        else if (finalGesture === "swipe_left") callbacksRef.current.onSwipeLeft?.();
        else if (finalGesture === "swipe_right") callbacksRef.current.onSwipeRight?.();
        else if (finalGesture === "thumbs_up") callbacksRef.current.onThumbsUp?.();
        else if (finalGesture === "victory") callbacksRef.current.onVictory?.();
        else if (finalGesture === "palm_stop") callbacksRef.current.onPalmStop?.();
        else if (finalGesture === "index_point") callbacksRef.current.onIndexPoint?.();
        else if (finalGesture === "ok_sign") callbacksRef.current.onOkSign?.();
        else if (finalGesture === "pinch") callbacksRef.current.onPinch?.();
        else if (finalGesture === "three") callbacksRef.current.onThree?.();
        else if (finalGesture === "wave") callbacksRef.current.onWave?.();
      }
    } else {
      setState(s => ({ ...s, handDetected: false, activeGesture: "none", fps }));
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [detectSwipe, detectWave]);

  const enable = useCallback(async () => {
    setState(s => ({ ...s, error: null }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } });
      streamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "");
      video.muted = true;
      await video.play();
      videoRef.current = video;

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker_lite/float16/latest/hand_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });

      setState(s => ({ ...s, enabled: true, cameraReady: true }));
      animFrameRef.current = requestAnimationFrame(processFrame);
    } catch (err: any) {
      const msg = err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
        ? "Camera permission denied"
        : err.message || "Failed to start gesture control";
      setState(s => ({ ...s, error: msg, enabled: false, cameraReady: false }));
    }
  }, [processFrame]);

  const disable = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (handLandmarkerRef.current) {
      handLandmarkerRef.current.close();
      handLandmarkerRef.current = null;
    }
    videoRef.current = null;
    prevWristYRef.current = null;
    prevWristXRef.current = null;
    wavePrevWristXRef.current = null;
    lastGestureRef.current = { gesture: "none", time: 0 };
    fistStartRef.current = 0;
    setState({
      enabled: false, activeGesture: "none", confidence: 0,
      fps: 0, handDetected: false, cameraReady: false, error: null,
    });
  }, []);

  useEffect(() => {
    return () => { disable(); };
  }, [disable]);

  return { state, enable, disable, registerCallbacks };
}
