import posthog from 'posthog-js';

// PostHog Configuration
// Replace with your actual PostHog project API key and host
const POSTHOG_API_KEY = 'phc_kxZPF3IrxPyitj3oxG3rucUTliOnhCM4NMW55shsgMI';
const POSTHOG_HOST = 'https://us.i.posthog.com'; // or 'https://eu.i.posthog.com' for EU

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      // Capture page views automatically
      capture_pageview: true,
      // Capture page leaves for session duration
      capture_pageleave: true,
      // Enable session recording for replay
      enable_recording_consent: false,
      // Autocapture clicks, form submissions, etc.
      autocapture: true,
      // Persist across sessions
      persistence: 'localStorage+cookie',
      // Enable heatmaps
      enable_heatmaps: true,
      // Bootstrap with useful properties
      loaded: (posthog) => {
        // Identify device capabilities
        posthog.register({
          app_name: '3DMenu',
          app_version: '1.0.0',
          has_ar_support: checkARSupport(),
          has_webxr_support: checkWebXRSupport(),
          device_type: getDeviceType(),
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          is_mobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
          is_ios: /iPhone|iPad|iPod/i.test(navigator.userAgent),
          browser: getBrowserName(),
        });
      },
    });
  }
  return posthog;
};

// Utility: Check AR support
function checkARSupport() {
  return 'xr' in navigator || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Utility: Check WebXR support
function checkWebXRSupport() {
  return 'xr' in navigator;
}

// Utility: Get device type
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Utility: Get browser name
function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'IE';
  if (ua.includes('Edge')) return 'Edge Legacy';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

export default posthog;
