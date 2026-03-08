import { useCallback, useRef, useEffect } from 'react';
import posthog from './posthog';

/**
 * Custom hook for tracking 3D Menu analytics events via PostHog.
 * Provides functions for every user interaction in the menu system.
 */
export const useAnalytics = () => {
    const sessionStartTime = useRef(Date.now());
    const itemViewTimes = useRef({});
    const itemsViewed = useRef(new Set());
    const itemsCarted = useRef(new Set());

    // Track session end on unmount
    useEffect(() => {
        return () => {
            const sessionDuration = (Date.now() - sessionStartTime.current) / 1000;
            posthog.capture('session_ended', {
                session_duration_seconds: sessionDuration,
                total_items_viewed: itemsViewed.current.size,
                total_items_carted: itemsCarted.current.size,
                items_viewed_list: Array.from(itemsViewed.current),
                items_carted_list: Array.from(itemsCarted.current),
            });
        };
    }, []);

    // ─── Menu & Page Events ───────────────────────────────
    const trackMenuOpened = useCallback((source = 'direct') => {
        posthog.capture('menu_opened', {
            source,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || 'none',
            url: window.location.href,
        });
    }, []);

    // ─── Search Events ────────────────────────────────────
    const trackSearch = useCallback((query, resultsCount) => {
        posthog.capture('search_performed', {
            search_query: query,
            results_count: resultsCount,
            has_results: resultsCount > 0,
            query_length: query.length,
        });
    }, []);

    // ─── Filter Events ────────────────────────────────────
    const trackCategoryFilter = useCallback((category, previousCategory, itemsCount) => {
        posthog.capture('category_filtered', {
            category,
            previous_category: previousCategory,
            items_in_category: itemsCount,
        });
    }, []);

    // ─── Item Interaction Events ──────────────────────────
    const trackItemViewed = useCallback((item, position) => {
        itemsViewed.current.add(item.id);
        posthog.capture('item_viewed', {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            item_price: item.price,
            is_recommended: item.recommended || false,
            position_in_list: position,
        });
    }, []);

    const trackItemImpression = useCallback((item, position, viewportTimeMs) => {
        posthog.capture('item_impression', {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            item_price: item.price,
            position_in_list: position,
            viewport_time_ms: viewportTimeMs,
        });
    }, []);

    // ─── 3D Model Events ─────────────────────────────────
    const track3DToggle = useCallback((item, action) => {
        const now = Date.now();
        let viewDurationMs = 0;

        if (action === 'show_image' && itemViewTimes.current[item.id]) {
            viewDurationMs = now - itemViewTimes.current[item.id];
        } else if (action === 'show_3d') {
            itemViewTimes.current[item.id] = now;
        }

        posthog.capture('3d_model_toggled', {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            item_price: item.price,
            action, // 'show_3d' or 'show_image'
            view_duration_ms: viewDurationMs,
        });
    }, []);

    // ─── AR Events ────────────────────────────────────────
    const trackARStarted = useCallback((item) => {
        itemViewTimes.current[`ar_${item.id}`] = Date.now();
        posthog.capture('ar_view_started', {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            item_price: item.price,
            is_recommended: item.recommended || false,
        });
    }, []);

    const trackARCompleted = useCallback((item) => {
        const startTime = itemViewTimes.current[`ar_${item.id}`];
        const durationSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;

        posthog.capture('ar_view_completed', {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            item_price: item.price,
            duration_seconds: durationSeconds,
        });
    }, []);

    const trackARFailed = useCallback((item, error) => {
        posthog.capture('ar_view_failed', {
            item_id: item.id,
            item_name: item.name,
            error_message: error,
        });
    }, []);

    // ─── Cart Events ──────────────────────────────────────
    const trackAddToCart = useCallback((item) => {
        itemsCarted.current.add(item.id);

        // Time from menu open to cart add
        const timeToCartSeconds = (Date.now() - sessionStartTime.current) / 1000;

        // Check if user viewed 3D or AR before adding to cart
        const viewed3D = itemViewTimes.current[item.id] ? true : false;
        const viewedAR = itemViewTimes.current[`ar_${item.id}`] ? true : false;

        posthog.capture('add_to_cart', {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            item_price: item.price,
            is_recommended: item.recommended || false,
            time_to_cart_seconds: timeToCartSeconds,
            viewed_3d_before_cart: viewed3D,
            viewed_ar_before_cart: viewedAR,
            cart_size: itemsCarted.current.size,
        });
    }, []);

    // ─── Model Performance Events ─────────────────────────
    const trackModelLoadTime = useCallback((item, loadDurationMs, success) => {
        posthog.capture('model_load_performance', {
            item_id: item.id,
            item_name: item.name,
            load_duration_ms: loadDurationMs,
            load_success: success,
        });
    }, []);

    // ─── Scroll / Engagement Events ───────────────────────
    const trackScrollDepth = useCallback((scrollPercentage, visibleItems) => {
        posthog.capture('scroll_depth', {
            scroll_percentage: scrollPercentage,
            visible_items_count: visibleItems,
        });
    }, []);

    return {
        trackMenuOpened,
        trackSearch,
        trackCategoryFilter,
        trackItemViewed,
        trackItemImpression,
        track3DToggle,
        trackARStarted,
        trackARCompleted,
        trackARFailed,
        trackAddToCart,
        trackModelLoadTime,
        trackScrollDepth,
    };
};

export default useAnalytics;
