import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useHandGesture } from "./useHandGesture";
import type { GestureState } from "./GestureTypes";

type GestureContextValue = {
  state: GestureState;
  enable: () => Promise<void>;
  disable: () => void;
};

const GestureContext = createContext<GestureContextValue | null>(null);

export function GestureProvider({ children }: { children: React.ReactNode }) {
  const { state, enable, disable, registerCallbacks } = useHandGesture();
  const [, setLocation] = useLocation();
  const sectionsRef = useRef<string[]>(["/", "/research", "/essay", "/quiz", "/flashcards", "/study-notes", "/virtual-lab", "/logic", "/study-games", "/test-conductor", "/simulations", "/debate-mentor", "/about"]);
  const currentIdxRef = useRef(0);
  const scrollTimeoutRef = useRef<number>(0);

  const getCurrentSectionIndex = useCallback(() => {
    const path = window.location.pathname.replace(/\/$/,"");
    const idx = sectionsRef.current.findIndex(s => s === path || (path.endsWith(s) && s !== "/"));
    return idx >= 0 ? idx : 0;
  }, []);

  const handleScrollUp = useCallback(() => {
    window.scrollBy({ top: -window.innerHeight * 0.4, behavior: "smooth" });
  }, []);

  const handleScrollDown = useCallback(() => {
    window.scrollBy({ top: window.innerHeight * 0.4, behavior: "smooth" });
  }, []);

  const handleSwipeLeft = useCallback(() => {
    currentIdxRef.current = getCurrentSectionIndex();
    const next = Math.min(currentIdxRef.current + 1, sectionsRef.current.length - 1);
    setLocation(sectionsRef.current[next]);
  }, [getCurrentSectionIndex, setLocation]);

  const handleSwipeRight = useCallback(() => {
    currentIdxRef.current = getCurrentSectionIndex();
    const prev = Math.max(currentIdxRef.current - 1, 0);
    setLocation(sectionsRef.current[prev]);
  }, [getCurrentSectionIndex, setLocation]);

  const handleThumbsUp = useCallback(() => {
    const cta = document.querySelector('a[href="/quiz"]');
    if (cta instanceof HTMLElement) cta.click();
  }, []);

  const handleVictory = useCallback(() => {
    const menuBtn = document.querySelector('[data-nav-toggle]');
    if (menuBtn instanceof HTMLElement) menuBtn.click();
  }, []);

  const handlePalmStop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleIndexPoint = useCallback(() => {
    const focusable = document.querySelector<HTMLElement>("a, button, input, [tabindex]:not([tabindex='-1'])");
    if (focusable) focusable.focus();
  }, []);

  const handleOkSign = useCallback(() => {
    const formBtn = document.querySelector<HTMLElement>('button[type="submit"], [data-ok]');
    if (formBtn) formBtn.click();
  }, []);

  const handlePinch = useCallback(() => {
    window.dispatchEvent(new CustomEvent("gesture:pinch-toggle"));
  }, []);

  const handleThree = useCallback(() => {
    const searchInput = document.querySelector<HTMLElement>('input[type="search"], [data-search]');
    if (searchInput) searchInput.focus();
  }, []);

  const handleWave = useCallback(() => {
    setLocation("/");
  }, [setLocation]);

  useEffect(() => {
    registerCallbacks({
      onScrollUp: handleScrollUp,
      onScrollDown: handleScrollDown,
      onSwipeLeft: handleSwipeLeft,
      onSwipeRight: handleSwipeRight,
      onThumbsUp: handleThumbsUp,
      onVictory: handleVictory,
      onPalmStop: handlePalmStop,
      onIndexPoint: handleIndexPoint,
      onOkSign: handleOkSign,
      onPinch: handlePinch,
      onThree: handleThree,
      onWave: handleWave,
      onDisable: disable,
    });
  }, [registerCallbacks, handleScrollUp, handleScrollDown, handleSwipeLeft, handleSwipeRight, handleThumbsUp, handleVictory, handlePalmStop, handleIndexPoint, handleOkSign, handlePinch, handleThree, handleWave, disable]);

  return (
    <GestureContext.Provider value={{ state, enable, disable }}>
      {children}
    </GestureContext.Provider>
  );
}

export function useGesture() {
  const ctx = useContext(GestureContext);
  if (!ctx) throw new Error("useGesture must be used within GestureProvider");
  return ctx;
}
