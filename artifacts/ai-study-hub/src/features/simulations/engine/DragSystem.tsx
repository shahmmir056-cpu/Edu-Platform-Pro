import { useCallback, useRef, useState } from "react";

interface DragItem {
  id: string;
  x: number;
  y: number;
}

interface DropZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseDragDropOptions {
  dropZones: DropZone[];
  onDrop?: (itemId: string, zoneId: string | null) => void;
}

export function useDragDrop({ dropZones, onDrop }: UseDragDropOptions) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const findZone = useCallback(
    (x: number, y: number): string | null => {
      for (const z of dropZones) {
        if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
          return z.id;
        }
      }
      return null;
    },
    [dropZones]
  );

  const handlePointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setDragging(id);
      setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragPos({ x, y });
      setHoveredZone(findZone(x, y));
    },
    [dragging, findZone]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const zoneId = findZone(x, y);
      onDrop?.(dragging, zoneId);
      setDragging(null);
      setHoveredZone(null);
    },
    [dragging, findZone, onDrop]
  );

  return {
    dragging,
    dragPos,
    hoveredZone,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
