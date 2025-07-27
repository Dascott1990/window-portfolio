// components/MapComponent.js
"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

const MapComponent = ({ darkMode, userLocation, searchQuery }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerLayer = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Initialize the map only on client side
    mapInstance.current = L.map(mapRef.current, {
      center: [51.505, -0.09], // Default center (London)
      zoom: 13,
      zoomControl: false,
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance.current);

    // Add zoom control
    L.control.zoom({
      position: 'topright',
    }).addTo(mapInstance.current);

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
          className: 'user-location-marker',
          html: '<div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(markerLayer.current);
    }
  }, [userLocation]);

  // Handle search
  useEffect(() => {
    if (searchQuery && mapInstance.current) {
      console.log('Searching for:', searchQuery);
      // In a real implementation, you would call a geocoding API here
    }
  }, [searchQuery]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{
        filter: darkMode ? 'brightness(0.8) contrast(1.1) grayscale(0.2)' : 'none',
      }}
    />
  );
};

export default MapComponent;