export type Gesture =
  | "scroll_up"
  | "scroll_down"
  | "swipe_left"
  | "swipe_right"
  | "palm_stop"
  | "thumbs_up"
  | "victory"
  | "fist_hold"
  | "index_point"
  | "ok_sign"
  | "pinch"
  | "three"
  | "wave"
  | "none";

export type GestureEvent = {
  gesture: Gesture;
  confidence: number;
};

export type GestureState = {
  enabled: boolean;
  activeGesture: Gesture;
  confidence: number;
  fps: number;
  handDetected: boolean;
  cameraReady: boolean;
  error: string | null;
};

export const GESTURE_COOLDOWN_MS = 600;
export const FIST_HOLD_MS = 2000;
export const SCROLL_SPEED = 6;
export const SWIPE_THRESHOLD = 300;
export const MOTION_THRESHOLD = 15;
export const PINCH_DISTANCE = 0.04;
export const OK_DISTANCE = 0.07;
export const WAVE_WINDOW_MS = 1200;
export const WAVE_DIRECTION_CHANGES = 2;
