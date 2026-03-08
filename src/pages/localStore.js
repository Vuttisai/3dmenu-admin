/**
 * Local event store — mirrors events to localStorage so the dashboard
 * can display real data even without PostHog API access.
 */
const STORAGE_KEY = "ph_analytics_local";
const MAX_EVENTS = 500;

export const saveLocalEvent = (eventName, properties = {}) => {
    try {
        const events = getLocalEvents();
        events.push({
            event: eventName,
            properties,
            timestamp: new Date().toISOString(),
        });
        // Keep only the latest MAX_EVENTS
        const trimmed = events.slice(-MAX_EVENTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
        // localStorage might be full — silently ignore
    }
};

export const getLocalEvents = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const clearLocalEvents = () => {
    localStorage.removeItem(STORAGE_KEY);
};
