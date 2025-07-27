// components/MapComponent.js
"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ darkMode, userLocation, searchQuery }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerLayer = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize the map
    mapInstance.current = L.map(mapRef.current, {
      center: [51.505, -0.09], // Default center (London)
      zoom: 13,
      zoomControl: false,
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance.current);

    // Add zoom control
    L.control
      .zoom({
        position: "topright",
      })
      .addTo(mapInstance.current);

    // Create layer for markers
    markerLayer.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // Update map when user location changes
  useEffect(() => {
    if (userLocation && mapInstance.current) {
      mapInstance.current.setView([userLocation.lat, userLocation.lng], 15);
      
      // Clear previous markers
      markerLayer.current.clearLayers();
      
      // Add new marker
      L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          className: "user-location-marker",
          html: `<div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(markerLayer.current);
    }
  }, [userLocation]);

  // Handle search (simplified - in a real app you'd use a geocoding service)
  useEffect(() => {
    if (searchQuery && mapInstance.current) {
      // This is where you would call a geocoding API in a real implementation
      console.log("Searching for:", searchQuery);
      // For demo purposes, we'll just log it
    }
  }, [searchQuery]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{
        filter: darkMode ? "brightness(0.8) contrast(1.1) grayscale(0.2)" : "none",
      }}
    />
  );
};

export default MapComponent;