const API_BASE = 'https://threedmenu-api.onrender.com';

// ── Menu Items ──────────────────────────────────────

export async function fetchAllMenuItems() {
  const res = await fetch(`${API_BASE}/api/menu-items/all`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function fetchActiveMenuItems() {
  const res = await fetch(`${API_BASE}/api/menu-items`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createMenuItem(item) {
  const res = await fetch(`${API_BASE}/api/menu-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

export async function updateMenuItem(id, item) {
  const res = await fetch(`${API_BASE}/api/menu-items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

export async function deleteMenuItem(id) {
  const res = await fetch(`${API_BASE}/api/menu-items/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

// ── Analytics ───────────────────────────────────────

export async function trackEvent(eventData) {
  try {
    await fetch(`${API_BASE}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
  } catch (e) {
    // Silent fail — never block UI for analytics
    console.warn('Analytics track failed:', e.message);
  }
}

export async function fetchAnalyticsSummary(days = 7) {
  const res = await fetch(`${API_BASE}/api/analytics/summary?days=${days}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function fetchAnalyticsItems(days = 7) {
  const res = await fetch(`${API_BASE}/api/analytics/items?days=${days}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function fetchAnalyticsFunnel(days = 7) {
  const res = await fetch(`${API_BASE}/api/analytics/funnel?days=${days}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function fetchAnalyticsSearches(days = 7) {
  const res = await fetch(`${API_BASE}/api/analytics/searches?days=${days}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function fetchAnalyticsHourly(days = 7) {
  const res = await fetch(`${API_BASE}/api/analytics/hourly?days=${days}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function fetchAnalyticsDaily(days = 30) {
  const res = await fetch(`${API_BASE}/api/analytics/daily?days=${days}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function fetchAnalyticsEvents(days = 7, itemId = null) {
  let url = `${API_BASE}/api/analytics/events?days=${days}`;
  if (itemId) url += `&item_id=${itemId}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}
