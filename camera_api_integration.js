/**
 * Camera.js — Backend Integration Patch
 * ──────────────────────────────────────
 * Add this code to Camera.js.
 *
 * STEP 1: Add after your imports at the top of Camera.js
 */

// ─── Backend API base URL ──────────────────────────────────────────────────
const CAMERA_API = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/camera`
  : "http://localhost:5001/api/v1/camera";

// ─── API helpers ───────────────────────────────────────────────────────────
const cameraAPI = {
  /**
   * Save a photo.
   * Pass the canvas data-URL exactly as Camera.js produces it:
   *   canvas.toDataURL("image/jpeg", 0.92)
   */
  async savePhoto({ dataUrl, mode, caption, filterName, overlayData }) {
    const res = await fetch(`${CAMERA_API}/photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data_url:     dataUrl,
        mode:         mode      || "photo",
        caption:      caption   || null,
        filter_name:  filterName || null,
        overlay_data: overlayData || null,
      }),
    });
    if (!res.ok) throw new Error(`Save photo failed: ${res.status}`);
    return res.json();   // { success, data: { id, file_url, thumbnail_url, ... } }
  },

  /**
   * Save a video recording.
   * Pass the Blob that MediaRecorder produces.
   */
  async saveVideo({ blob, mode, duration }) {
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");
    formData.append("mode",     mode     || "video");
    formData.append("duration", String(duration || 0));
    const res = await fetch(`${CAMERA_API}/video`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`Save video failed: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch gallery for a specific album tab.
   * album: "all" | "video" | mode-id (portrait, night, ai, ...)
   */
  async getGallery({ album = "all", page = 1, perPage = 30 } = {}) {
    const res = await fetch(
      `${CAMERA_API}/gallery?album=${album}&page=${page}&per_page=${perPage}`
    );
    if (!res.ok) throw new Error(`Gallery fetch failed: ${res.status}`);
    return res.json();  // { success, data: [...], meta: { total, page, ... } }
  },

  /**
   * Update caption / filter / overlay for an existing item.
   */
  async saveEdit({ id, caption, filterName, overlayData }) {
    const res = await fetch(`${CAMERA_API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption:      caption      ?? undefined,
        filter_name:  filterName   ?? undefined,
        overlay_data: overlayData  ?? undefined,
      }),
    });
    if (!res.ok) throw new Error(`Save edit failed: ${res.status}`);
    return res.json();
  },

  /**
   * Delete an item permanently (soft-delete on server, files removed).
   */
  async deleteItem(id) {
    const res = await fetch(`${CAMERA_API}/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
    return true;
  },
};


/**
 * STEP 2: Replace your existing capture function.
 *
 * Find in Camera.js: const capturePhoto = useCallback(async () => {
 * Replace the section where it does:
 *   dispatch({ type:"ADD_IMAGE", img: { src: dataUrl, ... } })
 *
 * With the version below that ALSO saves to backend:
 */

// Inside Camera component — replace your capturePhoto handler:
const capturePhotoWithSave = useCallback(async () => {
  const canvas  = canvasRef.current;
  const video   = videoRef.current;
  if (!canvas || !video) return;

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx     = canvas.getContext("2d");

  // Apply CSS filter matching current mode
  const filter  = FILTERS[st.mode] || "";
  ctx.filter    = filter || "none";
  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const ts      = Date.now();

  // Add to local state immediately (instant UI feedback)
  dispatch({
    type: "ADD_IMAGE",
    img: {
      src:   dataUrl,
      mode:  st.mode,
      ts,
      type:  "photo",
      caption: "",
      savedId: null,   // will be set after backend responds
    },
  });

  note("📸 Saving...");

  // Save to backend in background
  try {
    const result = await cameraAPI.savePhoto({
      dataUrl,
      mode:       st.mode,
      filterName: st.mode,
    });
    // Update the captured image with the server-assigned ID
    // so gallery edit/delete can reference it later
    dispatch({
      type: "SET",
      payload: {
        capturedImages: st.capturedImages.map((img) =>
          img.ts === ts ? { ...img, savedId: result.data.id } : img
        ),
      },
    });
    note("✅ Saved");
  } catch (err) {
    console.error("Camera save failed:", err);
    note("⚠️ Saved locally only");
  }
}, [st.mode, st.capturedImages, note]);


/**
 * STEP 3: When the user saves caption edits in the gallery,
 * also persist to backend.
 *
 * Find the UPDATE_CAPTION dispatch in Camera.js and add:
 */
const saveCaptionToBackend = useCallback(async (index, caption) => {
  const img = st.capturedImages[index];
  if (!img?.savedId) return;   // not yet persisted, skip
  try {
    await cameraAPI.saveEdit({ id: img.savedId, caption });
  } catch (err) {
    console.error("Caption save failed:", err);
  }
}, [st.capturedImages]);


/**
 * STEP 4: When the user deletes an item in the gallery,
 * also delete from backend.
 *
 * Find where Camera.js dispatches DEL_IMAGE and add:
 */
const deleteFromBackend = useCallback(async (index) => {
  const img = st.capturedImages[index];
  if (!img?.savedId) return;
  try {
    await cameraAPI.deleteItem(img.savedId);
  } catch (err) {
    console.error("Delete from backend failed:", err);
  }
}, [st.capturedImages]);


/**
 * STEP 5: Add to your .env.local in the Next.js project root:
 *
 *   NEXT_PUBLIC_API_URL=http://localhost:5001
 *
 * This makes the API URL configurable per environment.
 */


