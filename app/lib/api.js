const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`);
  return json.data ?? json;
}

export const contactsAPI = {
  list:      (q = "")   => request(`/api/v1/contacts${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  favorites: ()          => request("/api/v1/contacts/favorites"),
  create:    (data)      => request("/api/v1/contacts", { method: "POST", body: JSON.stringify(data) }),
  update:    (id, data)  => request(`/api/v1/contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove:    (id)        => request(`/api/v1/contacts/${id}`, { method: "DELETE" }),
};

export const eventsAPI = {
  listByDate:  (dateStr)     => request(`/api/v1/events?date=${dateStr}`),
  listByMonth: (year, month) => request(`/api/v1/events?year=${year}&month=${month}`),
  create:      (data)        => request("/api/v1/events", { method: "POST", body: JSON.stringify(data) }),
  update:      (id, data)    => request(`/api/v1/events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove:      (id)          => request(`/api/v1/events/${id}`, { method: "DELETE" }),
};
// ── Add this block to app/lib/api.js ──────────────────────────────────────────
export const resumeAPI = {
  generate: (userInfo, jobDescription) =>
    request("/api/v1/resume/generate", {
      method: "POST",
      body: JSON.stringify({ user_info: userInfo, job_description: jobDescription }),
    }),
  list:   ()   => request("/api/v1/resume/saved"),
  get:    (id) => request(`/api/v1/resume/${id}`),
  remove: (id) => request(`/api/v1/resume/${id}`, { method: "DELETE" }),
};
export const cameraAPI = {
  savePhoto: ({ dataUrl, mode, caption, filterName, overlayData }) =>
    request("/api/v1/camera/photo", {
      method: "POST",
      body: JSON.stringify({ data_url: dataUrl, mode: mode || "photo", caption: caption || null, filter_name: filterName || null, overlay_data: overlayData || null }),
    }),
  saveVideo: async ({ blob, mode, duration }) => {
    const fd = new FormData();
    fd.append("file", blob, "recording.webm");
    fd.append("mode", mode || "video");
    fd.append("duration", String(duration || 0));
    const res = await fetch(`${BASE}/api/v1/camera/video`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`Save video failed: ${res.status}`);
    return (await res.json()).data;
  },
  gallery:      (album = "all", page = 1) => request(`/api/v1/camera/gallery?album=${album}&page=${page}&per_page=30`),
  recent:       (limit = 10)              => request(`/api/v1/camera/gallery/recent?limit=${limit}`),
  saveEdit:     (id, data)                => request(`/api/v1/camera/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteItem:   (id)                      => request(`/api/v1/camera/${id}`, { method: "DELETE" }),
  fileUrl:      (id) => `${BASE}/api/v1/camera/${id}/file`,
  thumbnailUrl: (id) => `${BASE}/api/v1/camera/${id}/thumbnail`,
};

export const transactionsAPI = {
  list:    () => request("/api/v1/transactions"),
  summary: (cur) => request(`/api/v1/transactions/summary?currency=${cur || "CAD"}`),
};

export const walletAPI = {
  get:     (currency = "CAD") => request(`/api/v1/wallet?currency=${currency}`),
  topUp:   (data)             => request("/api/v1/wallet/top-up", { method: "POST", body: JSON.stringify(data) }),
  send:    (data)             => request("/api/v1/wallet/send",   { method: "POST", body: JSON.stringify(data) }),
  request: (data)             => request("/api/v1/wallet/request",{ method: "POST", body: JSON.stringify(data) }),
  cards:   (currency = "CAD") => request(`/api/v1/wallet/cards?currency=${currency}`),
  addCard: (data)             => request("/api/v1/wallet/cards",  { method: "POST", body: JSON.stringify(data) }),
};

export const projectsAPI = {
  list:   (featured = false) => request(`/api/v1/projects${featured ? "?featured=true" : ""}`),
  create: (data)             => request("/api/v1/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data)         => request(`/api/v1/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id)               => request(`/api/v1/projects/${id}`, { method: "DELETE" }),
};

export const healthAPI = {
  list:   () => request("/api/v1/health"),
  create: (data) => request("/api/v1/health", { method: "POST", body: JSON.stringify(data) }),
};

export const ping = () => request("/health");
