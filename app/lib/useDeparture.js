"use client";
/**
 * useDeparture.js
 * app/lib/useDeparture.js  (or app/hooks/useDeparture.js)
 *
 * Single shared hook + modal for every external link in the portfolio.
 * Import useDeparture anywhere; render <DepartureModal> once at the top.
 *
 * Usage:
 *   const { open, modal } = useDeparture();
 *   <button onClick={() => open("https://github.com/...")}>GitHub</button>
 *   {modal}
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiExternalLink, FiX } from "react-icons/fi";

// ── tiny domain → label helper ────────────────────────────────────────────────
function labelFor(href) {
  try {
    const { hostname } = new URL(href);
    const h = hostname.replace("www.", "");
    if (h.includes("github"))   return "GitHub";
    if (h.includes("linkedin")) return "LinkedIn";
    if (h.includes("twitter") || h.includes("x.com")) return "X / Twitter";
    if (h.includes("hyperswitch")) return "Hyperswitch.io";
    return h;
  } catch {
    return href;
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function DepartureModal({ href, onClose }) {
  const label = labelFor(href);

  useEffect(() => {
    if (!href) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [href, onClose]);

  const go = useCallback(() => {
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  }, [href, onClose]);

  return (
    <AnimatePresence>
      {href && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 6,  scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl overflow-hidden"
            style={{
              background: "rgba(17,20,32,0.98)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  <FiExternalLink size={13} style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">{label}</p>
                  <p className="text-white/35 text-[11px] font-mono truncate max-w-[180px]">
                    {href.replace(/^https?:\/\/(www\.)?/, "")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-white/30 hover:text-white/70 transition-colors"
                aria-label="Dismiss"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

            {/* Actions */}
            <div className="flex gap-2 p-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 transition-colors"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                Cancel
              </button>
              <button
                onClick={go}
                className="flex-[2] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                style={{ background: "#2563eb", color: "#fff" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
              >
                Open {label}
                <FiExternalLink size={12} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useDeparture() {
  const [href, setHref] = useState(null);

  const open = useCallback((url) => {
    try { new Audio("/click.wav").play(); } catch {}
    setHref(url);
  }, []);

  const close = useCallback(() => setHref(null), []);

  const modal = <DepartureModal href={href} onClose={close} />;

  return { open, modal };
}