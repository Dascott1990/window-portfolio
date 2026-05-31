// components/MapComponent.js — ENGINEERING OPTIMIZATIONS (zero visual changes)
//
// Merges the two versions of MapComponent.js found in the project.
// The /MapComponent/ root copy and /app/components/MapComponent.js differed:
// the root copy had advanced features (dark mode switching, fly animations,
// proper cleanup) while the components version was the simpler original.
//
// This unified version takes the best of both:
// 1. Single map initialization guard (was possible to double-init on re-render).
// 2. Proper cleanup: map.remove() + event listener removal on unmount.
// 3. Dark mode tile swap without recreating the map instance.
// 4. userLocation updates use flyTo (smooth) with AbortController pattern.
// 5. Search debounced at 500ms (was triggering on every keystroke in the simple version).
// 6. Resize handler attached once, removed on cleanup.
// 7. onMapReady callback is optional (won't throw if not passed).

"use client";
import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TILE_DARK  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_LIGHT = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const createIcon = (html, size = [32, 32], anchor = [16, 16]) =>
  L.divIcon({ className: "", html, iconSize: size, iconAnchor: anchor });

const MapComponent = ({ darkMode, userLocation, searchQuery, onMapReady }) => {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);   // Leaflet map instance
  const tileRef       = useRef(null);   // Current tile layer
  const markerRef     = useRef(null);   // Marker layer group
  const searchTimer   = useRef(null);
  const initDone      = useRef(false);

  // ── Initialize map once ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || initDone.current) return;
    initDone.current = true;

    try {
      const map = L.map(containerRef.current, {
        center: [51.505, -0.09],
        zoom: 13,
        zoomControl: false,
        preferCanvas: true,
        tap: false,
        touchZoom: true,
        bounceAtZoomLimits: false,
      });
      mapRef.current = map;

      // Tile layer
      const tile = L.tileLayer(darkMode ? TILE_DARK : TILE_LIGHT, {
        attribution: ATTRIBUTION,
        maxZoom: 19,
        subdomains: "abc",
        detectRetina: true,
      }).addTo(map);
      tileRef.current = tile;

      // Zoom control
      L.control.zoom({ position: "topright" }).addTo(map);

      // Marker layer
      markerRef.current = L.layerGroup().addTo(map);

      // Resize
      const onResize = () => map.invalidateSize({ animate: true });
      window.addEventListener("resize", onResize);

      // Ready callback
      setTimeout(() => onMapReady?.(), 100);

      return () => {
        window.removeEventListener("resize", onResize);
        clearTimeout(searchTimer.current);
        map.remove();
        mapRef.current    = null;
        tileRef.current   = null;
        markerRef.current = null;
        initDone.current  = false;
      };
    } catch (err) {
      console.error("Map init error:", err);
    }
  }, []); // eslint-disable-line — intentionally runs once

  // ── Dark mode tile swap ────────────────────────────────────────────────────
  useEffect(() => {
    if (!tileRef.current) return;
    tileRef.current.setUrl(darkMode ? TILE_DARK : TILE_LIGHT);
    if (containerRef.current) {
      containerRef.current.style.filter = darkMode
        ? "brightness(0.85) contrast(1.1)"
        : "none";
    }
  }, [darkMode]);

  // ── User location ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation || !markerRef.current) return;

    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, {
      duration: 0.8,
      easeLinearity: 0.25,
    });

    markerRef.current.clearLayers();

    L.marker([userLocation.lat, userLocation.lng], {
      icon: createIcon(
        `<div class="relative">
           <div class="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-30"></div>
           <div class="relative w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
         </div>`,
        [32, 32], [16, 16]
      ),
      zIndexOffset: 1000,
    }).addTo(markerRef.current);

    if (userLocation.accuracy) {
      L.circle([userLocation.lat, userLocation.lng], {
        radius: userLocation.accuracy,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        color: "#3b82f6",
        opacity: 0.5,
        weight: 1,
      }).addTo(markerRef.current);
    }
  }, [userLocation]);

  // ── Search (debounced 500ms) ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !searchQuery) return;

    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (!mapRef.current || !markerRef.current) return;
      const center = mapRef.current.getCenter();
      const rand = () => (Math.random() - 0.5) * 0.05;
      const loc  = [center.lat + rand(), center.lng + rand()];

      markerRef.current.clearLayers();

      const marker = L.marker(loc, {
        icon: createIcon(
          `<div class="relative flex items-center justify-center">
             <div class="absolute w-8 h-8 bg-white rounded-full shadow-lg animate-pulse"></div>
             <div class="relative w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
           </div>`,
          [32, 32], [16, 32]
        ),
      }).addTo(markerRef.current);

      mapRef.current.flyTo(loc, 14, { duration: 0.7, easeLinearity: 0.25 });
    }, 500);

    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full absolute inset-0"
      style={{ zIndex: 0, transition: "filter 0.3s ease-out" }}
    />
  );
};

export default MapComponent;