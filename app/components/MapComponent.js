"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icons
const createCustomIcon = (options) => {
  return L.divIcon({
    className: options.className || '',
    html: options.html,
    iconSize: options.size || [24, 24],
    iconAnchor: options.anchor || [12, 12]
  });
};

const MapComponent = ({ darkMode, userLocation, searchQuery, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerLayer = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [tileLayer, setTileLayer] = useState(null);

  // Initialize map with proper error handling
  const initMap = useCallback(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstance.current) return;

    try {
      mapInstance.current = L.map(mapRef.current, {
        center: [51.505, -0.09],
        zoom: 13,
        zoomControl: false,
        preferCanvas: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        inertia: true,
        inertiaDeceleration: 3000,
        inertiaMaxSpeed: 1500,
        tap: false, // Fix for mobile devices
        touchZoom: true,
        bounceAtZoomLimits: false
      });

      // Add tile layer with error fallback
      const layer = L.tileLayer(
        darkMode 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          subdomains: 'abc',
          detectRetina: true
        }
      ).addTo(mapInstance.current);
      setTileLayer(layer);

      // Marker layer with cluster support
      markerLayer.current = L.layerGroup().addTo(mapInstance.current);

      // Enable interactions
      mapInstance.current.touchZoom.enable();
      mapInstance.current.doubleClickZoom.enable();
      mapInstance.current.scrollWheelZoom.enable();

      // Handle map ready state
      setTimeout(() => {
        setMapReady(true);
        onMapReady?.();
      }, 100);

      // Handle window resize
      const handleResize = () => {
        mapInstance.current?.invalidateSize({ animate: true });
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    } catch (error) {
      console.error("Map initialization error:", error);
    }
  }, [darkMode, onMapReady]);

  // Initialize map on mount
  useEffect(() => {
    initMap();
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [initMap]);

  // Update tile layer when dark mode changes
  useEffect(() => {
    if (!tileLayer || !mapReady) return;

    const newTileUrl = darkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayer.setUrl(newTileUrl);

    // Smooth transition effect
    if (mapRef.current) {
      mapRef.current.style.transition = 'filter 0.3s ease-out';
      mapRef.current.style.filter = darkMode 
        ? 'brightness(0.85) contrast(1.1) hue-rotate(180deg)'
        : 'none';
    }
  }, [darkMode, tileLayer, mapReady]);

  // Handle user location updates
  const updateUserLocation = useCallback(() => {
    if (!mapReady || !userLocation || !mapInstance.current) return;

    try {
      // Smooth fly animation with easing
      mapInstance.current.flyTo([userLocation.lat, userLocation.lng], 15, {
        duration: 0.8,
        easeLinearity: 0.25,
      });

      // Clear previous markers
      markerLayer.current.clearLayers();

      // Add animated user marker
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createCustomIcon({
          className: 'user-location-marker',
          html: `
            <div class="relative">
              <div class="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-30 duration-2000"></div>
              <div class="relative w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
            </div>
          `,
          size: [32, 32],
          anchor: [16, 16]
        }),
        zIndexOffset: 1000
      }).addTo(markerLayer.current);

      // Add accuracy circle with smooth animation
      if (userLocation.accuracy) {
        L.circle([userLocation.lat, userLocation.lng], {
          radius: userLocation.accuracy,
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          color: '#3b82f6',
          opacity: 0.5,
          weight: 1
        }).addTo(markerLayer.current);
      }
    } catch (error) {
      console.error("Error updating user location:", error);
    }
  }, [userLocation, mapReady]);

  // Handle search queries with debouncing
  const handleSearch = useCallback(() => {
    if (!mapReady || !searchQuery || !mapInstance.current) return;

    const timer = setTimeout(() => {
      try {
        const center = mapInstance.current.getCenter();
        const randomOffset = () => (Math.random() - 0.5) * 0.05;
        const resultLocation = [
          center.lat + randomOffset(),
          center.lng + randomOffset(),
        ];

        markerLayer.current.clearLayers();

        // Add search result marker with animation
        const resultMarker = L.marker(resultLocation, {
          icon: createCustomIcon({
            className: 'search-result-marker',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 bg-white rounded-full shadow-lg animate-pulse"></div>
                <div class="relative w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
              </div>
            `,
            size: [32, 32],
            anchor: [16, 32]
          })
        }).addTo(markerLayer.current);

        // Smooth fly to location
        mapInstance.current.flyTo(resultLocation, 14, {
          duration: 0.7,
          easeLinearity: 0.25
        });

        // Bounce animation
        setTimeout(() => {
          resultMarker.setIcon(createCustomIcon({
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 bg-white rounded-full shadow-lg"></div>
                <div class="relative w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg animate-bounce"></div>
              </div>
            `,
            size: [32, 32],
            anchor: [16, 32]
          }));
        }, 700);
      } catch (error) {
        console.error("Error handling search:", error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, mapReady]);

  // Effect hooks for updates
  useEffect(() => updateUserLocation(), [updateUserLocation]);
  useEffect(() => handleSearch(), [handleSearch]);

  return (
    <div 
      ref={mapRef}
      className="w-full h-full absolute inset-0"
      style={{
        transition: 'filter 0.3s ease-out',
        zIndex: 0
      }}
    />
  );
};

export default MapComponent;