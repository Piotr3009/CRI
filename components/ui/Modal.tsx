"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * App-wide modal. Default behaviour for every modal unless asked otherwise:
 *  - portalled to <body> so it escapes ancestor stacking/containing contexts
 *    (e.g. the header's backdrop-blur, which would otherwise break position:fixed)
 *  - centered, with the overlay scrolling when content is taller than the viewport
 *  - draggable by its title bar on desktop (grab-and-move); drag disabled on touch
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") return; // no drag on touch devices
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const maxX = window.innerWidth / 2;
    const maxY = window.innerHeight / 2;
    const x = drag.current.baseX + (e.clientX - drag.current.startX);
    const y = drag.current.baseY + (e.clientY - drag.current.startY);
    setOffset({
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    });
  }

  function endDrag() {
    drag.current = null;
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/40"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="card my-8 w-full max-w-md shadow-card-hover"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex select-none items-center justify-between rounded-t-xl border-b border-cri-border px-5 py-3 sm:cursor-move"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="text-base font-bold text-cri-charcoal">
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Close"
              className="rounded-lg p-1 text-cri-steel hover:bg-black/5"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
