"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface Props {
  text: string;
}

interface TooltipPos {
  top: number;
  left: number;
  above: boolean;
  arrowLeft: number;
}

export default function Tooltip({ text }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<TooltipPos>({ top: 0, left: 0, above: true, arrowLeft: 120 });
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Wait for client mount before using portals
  useEffect(() => { setMounted(true); }, []);

  const calculate = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const TIP_WIDTH = 240;
    const iconCenterX = rect.left + rect.width / 2;

    // Horizontal: centre on icon, clamp to viewport
    let left = iconCenterX - TIP_WIDTH / 2;
    left = Math.max(8, Math.min(window.innerWidth - TIP_WIDTH - 8, left));
    const arrowLeft = Math.max(12, Math.min(TIP_WIDTH - 12, iconCenterX - left));

    // Vertical: prefer above, flip below if not enough room
    const above = rect.top > 120;
    const top = above ? rect.top - 8 : rect.bottom + 8;

    setPos({ top, left, above, arrowLeft });
  }, []);

  const show = useCallback(() => {
    calculate();
    setVisible(true);
  }, [calculate]);

  const hide = useCallback(() => setVisible(false), []);

  // Hide on any outside click
  useEffect(() => {
    if (!visible) return;
    const handler = () => setVisible(false);
    document.addEventListener("click", handler, { passive: true });
    return () => document.removeEventListener("click", handler);
  }, [visible]);

  return (
    <span className="inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => { e.stopPropagation(); if (visible) { hide(); } else { show(); } }}
        className="inline-flex items-center justify-center flex-shrink-0 cursor-pointer ml-1 focus:outline-none"
        style={{
          width: 16, height: 16,
          borderRadius: "50%",
          background: "#F3F4F6",
          color: "#6B7280",
          fontSize: 11,
          fontWeight: 600,
        }}
        aria-label={text}
      >
        ?
      </button>

      {mounted && visible && text && createPortal(
        <div
          style={{
            position: "fixed",
            top: pos.above ? pos.top : pos.top,
            left: pos.left,
            transform: pos.above ? "translateY(-100%) translateY(-8px)" : "none",
            zIndex: 9999,
            background: "#1E1E1E",
            color: "#fff",
            fontSize: 13,
            lineHeight: 1.5,
            maxWidth: 240,
            minWidth: 160,
            borderRadius: 8,
            padding: "10px 14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            pointerEvents: "none",
            whiteSpace: "normal",
          }}
        >
          {text}
          {/* Arrow pointing toward icon */}
          <div
            style={{
              position: "absolute",
              left: pos.arrowLeft - 6,
              ...(pos.above
                ? {
                    top: "100%",
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "6px solid #1E1E1E",
                  }
                : {
                    bottom: "100%",
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "6px solid #1E1E1E",
                  }),
            }}
          />
        </div>,
        document.body
      )}
    </span>
  );
}
