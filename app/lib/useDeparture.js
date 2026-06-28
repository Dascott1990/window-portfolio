"use client";
/**
 * useDeparture.js — app/lib/useDeparture.js
 *
 * Portal-based departure modal. Sits above everything including the taskbar.
 * No sound here — callers own their own click sound.
 *
 * Usage:
 *   const { open } = useDeparture();
 *   <button onClick={() => open("https://github.com/...")}>GitHub</button>
 */

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiExternalLink, FiX } from "react-icons/fi";

function labelFor(href) {
  try {
    const { hostname } = new URL(href);
    const h = hostname.replace("www.", "");
    if (h.includes("github"))   return "GitHub";
    if (h.includes("linkedin")) return "LinkedIn";
    if (h.includes("twitter") || h === "x.com") return "X / Twitter";
    if (h.includes("hyperswitch")) return "Hyperswitch.io";
    // fallback: capitalise first segment
    return h.split(".")[0].replace(/^\w/, c => c.toUpperCase());
  } catch {
    return "External site";
  }
}

function DepartureModal({ href, onClose }) {
  const label = labelFor(href || "");
  const displayUrl = (href || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  // ESC to close
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {href && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            // sit ABOVE taskbar (z-index 50 = 50, taskbar z-50)
            // but below nothing — we own the top
            zIndex: 10000,
            display: "flex",
            // align above the taskbar, not behind it
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "calc(var(--taskbar-height, 52px) + 12px)",
            paddingLeft: 16,
            paddingRight: 16,
            background: "rgba(0,0,0,0.4)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0,  y: 4,  scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 360 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 300,
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(15,18,30,0.98)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.75)",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 14px 11px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(59,130,246,0.14)",
                  border: "1px solid rgba(59,130,246,0.22)",
                }}>
                  <FiExternalLink size={12} style={{ color: "#60a5fa" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, color: "#fff", fontSize: 13, fontWeight: 500 }}>
                    {label}
                  </p>
                  <p style={{
                    margin: 0, color: "rgba(255,255,255,0.3)",
                    fontSize: 10, fontFamily: "monospace",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    maxWidth: 190,
                  }}>
                    {displayUrl}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Dismiss"
                style={{
                  background: "none", border: "none",
                  cursor: "pointer", padding: 4, flexShrink: 0,
                  color: "rgba(255,255,255,0.28)", lineHeight: 1,
                }}
              >
                <FiX size={13} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

            {/* Buttons */}
            <div style={{ display: "flex", gap: 7, padding: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 9,
                  cursor: "pointer", fontSize: 12,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={go}
                style={{
                  flex: 2, padding: "7px 0", borderRadius: 9,
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: "#2563eb", border: "none", color: "#fff",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 5,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
              >
                Open {label} <FiExternalLink size={11} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useDeparture() {
  const [href, setHref] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // No sound here — callers play their own click sound before calling open()
  const open  = useCallback((url) => setHref(url), []);
  const close = useCallback(() => setHref(null), []);

  const portal = mounted ? <DepartureModal href={href} onClose={close} /> : null;

  return { open, portal };
}