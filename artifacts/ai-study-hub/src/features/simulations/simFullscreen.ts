import { useSyncExternalStore } from "react";

let isFullscreen = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (isFullscreen === value) return;
  isFullscreen = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return isFullscreen;
}

export function setSimFullscreen(value: boolean) {
  set(value);
}

export function useSimFullscreen() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
