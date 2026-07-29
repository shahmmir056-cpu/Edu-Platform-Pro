import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, X, Camera, Activity } from "lucide-react";
import { useGesture } from "./GestureProvider";
import type { Gesture } from "./GestureTypes";

const GESTURE_LABELS: Record<Gesture, string> = {
  scroll_up: "Scrolling Up",
  scroll_down: "Scrolling Down",
  swipe_left: "Swipe Left",
  swipe_right: "Swipe Right",
  palm_stop: "Palm Stop",
  thumbs_up: "Thumbs Up!",
  victory: "Victory!",
  fist_hold: "Hold Fist…",
  index_point: "Pointing",
  ok_sign: "OK!",
  pinch: "Pinch",
  three: "Three Fingers",
  wave: "Wave",
  none: "",
};

const GESTURE_ICONS: Record<Gesture, string> = {
  scroll_up: "↑",
  scroll_down: "↓",
  swipe_left: "←",
  swipe_right: "→",
  palm_stop: "✋",
  thumbs_up: "👍",
  victory: "✌",
  fist_hold: "✊",
  index_point: "☝",
  ok_sign: "👌",
  pinch: "🤏",
  three: "🤟",
  wave: "👋",
  none: "",
};

export function GestureToggle() {
  const { state, enable, disable } = useGesture();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
        onClick={() => {
          if (state.enabled) {
            setPanelOpen(!panelOpen);
          } else {
            enable().catch(() => {});
            setPanelOpen(true);
          }
        }}
        className="fixed bottom-6 right-6 z-[100] flex items-center justify-center w-12 h-12 rounded-full shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: state.enabled
            ? "linear-gradient(135deg, rgba(255,159,76,0.2), rgba(232,133,46,0.15))"
            : "rgba(255,255,255,0.15)",
          border: state.enabled ? "1px solid rgba(255,159,76,0.3)" : "1px solid rgba(255,255,255,0.12)",
          boxShadow: state.enabled
            ? "0 4px 24px rgba(255,159,76,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {state.enabled ? (
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Hand size={18} style={{ color: "#FF9F4C" }} />
          </motion.div>
        ) : (
          <Hand size={18} style={{ color: "rgba(107,107,107,0.8)" }} />
        )}
      </motion.button>

      {/* Status panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-[100] w-64 rounded-2xl backdrop-blur-2xl overflow-hidden shadow-xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#FF9F4C" }}>Gesture Control</span>
              <button onClick={() => setPanelOpen(false)} className="p-1 rounded-full hover:bg-white/5 transition-colors" aria-label="Close gesture panel">
                <X size={12} style={{ color: "#9A9A9A" }} />
              </button>
            </div>

            {state.error ? (
              <div className="px-4 py-4 text-center">
                <p className="text-xs" style={{ color: "#E8852E" }}>{state.error}</p>
                <button
                  onClick={() => { enable().catch(() => {}); }}
                  className="mt-3 text-xs font-bold px-4 py-2 rounded-full transition-all hover:scale-105"
                  style={{ background: "rgba(255,159,76,0.1)", border: "1px solid rgba(255,159,76,0.15)", color: "#FF9F4C" }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-3">
                {/* Status row: camera */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera size={11} style={{ color: state.cameraReady ? "#4ADE80" : "#9A9A9A" }} />
                    <span className="text-[10px] font-medium" style={{ color: "#9A9A9A" }}>Camera</span>
                  </div>
                  <span className="text-[10px]" style={{ color: state.cameraReady ? "#4ADE80" : "#9A9A9A" }}>
                    {state.cameraReady ? "Connected" : "Off"}
                  </span>
                </div>

                {/* Status row: hand */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hand size={11} style={{ color: state.handDetected ? "#4ADE80" : "#9A9A9A" }} />
                    <span className="text-[10px] font-medium" style={{ color: "#9A9A9A" }}>Hand</span>
                  </div>
                  <span className="text-[10px]" style={{ color: state.handDetected ? "#4ADE80" : "#9A9A9A" }}>
                    {state.handDetected ? "Detected" : "Not detected"}
                  </span>
                </div>

                {/* Status row: FPS */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={11} style={{ color: "#9A9A9A" }} />
                    <span className="text-[10px] font-medium" style={{ color: "#9A9A9A" }}>FPS</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: state.fps > 15 ? "#4ADE80" : "#FF9F4C" }}>{state.fps}</span>
                </div>

                {/* Active gesture */}
                {state.activeGesture !== "none" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span className="text-lg" style={{ color: "#FF9F4C" }}>{GESTURE_ICONS[state.activeGesture]}</span>
                    <p className="text-[10px] font-bold mt-1 uppercase tracking-wider" style={{ color: "#FF9F4C" }}>
                      {GESTURE_LABELS[state.activeGesture]}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Footer */}
            {state.enabled && (
              <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <button
                  onClick={() => { disable(); setPanelOpen(false); }}
                  className="w-full text-[10px] font-bold py-2 rounded-xl transition-all hover:scale-[1.02] active:scale-98"
                  style={{ background: "rgba(232,133,46,0.08)", border: "1px solid rgba(232,133,46,0.12)", color: "#E8852E" }}
                >
                  Disable Gesture Control
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
