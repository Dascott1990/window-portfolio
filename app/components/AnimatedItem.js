/**
 * AnimatedItem.js — ENGINEERING OPTIMIZATIONS (zero visual changes)
 *
 * Replaces `react-visibility-sensor` with native IntersectionObserver:
 * - react-visibility-sensor relies on scroll/resize listeners on the window,
 *   which fire every frame during scroll (layout thrashing).
 * - IntersectionObserver is GPU-side: zero main-thread cost while scrolling.
 * - Identical visual output: element fades in + slides up when entering viewport.
 * - Threshold 0.1 matches "partialVisibility" behaviour of the old sensor.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const AnimatedItem = ({ animationConfig, children }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Once visible, stop observing — same as old sensor in one-shot mode
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0, ...animationConfig } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AnimatedItem;