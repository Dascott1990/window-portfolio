"use client";
/**
 * useCameraBackend.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop this hook into Camera.js.
 *
 * USAGE in Camera.js:
 *   import { useCameraBackend } from "./useCameraBackend";
 *   const { savePhoto, saveVideo, galleryItems, deleteItem } = useCameraBackend();
 *
 * Then:
 *   - Call savePhoto(dataUrl, mode) after capturePhoto()
 *   - Call saveVideo(blob, mode, duration) after stopRecording()
 *   - Use galleryItems as the initial/persisted gallery (merged with local state)
 *   - Call deleteItem(savedId) when user deletes
 */

import { useState, useEffect, useCallback } from "react";
import { cameraAPI } from "../../lib/api";

export function useCameraBackend() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ── Fetch persisted gallery on mount ────────────────────────────────────────
  const refreshGallery = useCallback(async (album = "all") => {
    try {
      setLoading(true);
      const data = await cameraAPI.gallery(album);
      // Normalise to the shape Camera.js uses internally
      const items = (Array.isArray(data) ? data : data?.items ?? []).map((m) => ({
        savedId:   m.id,
        src:       cameraAPI.fileUrl(m.id),
        thumbnail: m.thumbnail ? cameraAPI.thumbnailUrl(m.id) : cameraAPI.fileUrl(m.id),
        mode:      m.filter_name || m.metadata_json?.camera_mode || "photo",
        caption:   m.caption || "",
        type:      m.media_type === "video" ? "video" : "photo",
        ts:        new Date(m.created_at).getTime(),
      }));
      setGalleryItems(items);
    } catch (err) {
      console.error("Gallery load failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshGallery(); }, [refreshGallery]);

  // ── Save a photo ─────────────────────────────────────────────────────────────
  const savePhoto = useCallback(async (dataUrl, mode, caption = "") => {
    try {
      const result = await cameraAPI.savePhoto({ dataUrl, mode, caption, filterName: mode });
      return result?.id ?? null;
    } catch (err) {
      console.error("Photo save failed:", err);
      return null;
    }
  }, []);

  // ── Save a video ─────────────────────────────────────────────────────────────
  const saveVideo = useCallback(async (blob, mode, duration) => {
    try {
      const result = await cameraAPI.saveVideo({ blob, mode, duration });
      return result?.id ?? null;
    } catch (err) {
      console.error("Video save failed:", err);
      return null;
    }
  }, []);

  // ── Update caption ───────────────────────────────────────────────────────────
  const updateCaption = useCallback(async (savedId, caption) => {
    if (!savedId) return;
    try {
      await cameraAPI.saveEdit({ id: savedId, caption });
    } catch (err) {
      console.error("Caption update failed:", err);
    }
  }, []);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteItem = useCallback(async (savedId) => {
    if (!savedId) return;
    try {
      await cameraAPI.deleteItem(savedId);
      setGalleryItems((prev) => prev.filter((i) => i.savedId !== savedId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  return {
    galleryItems,
    loading,
    error,
    savePhoto,
    saveVideo,
    updateCaption,
    deleteItem,
    refreshGallery,
  };
}