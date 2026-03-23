/**
 * OpenPDF Studio Analytics Client
 * Lightweight analytics module for tracking app usage
 * Respects user privacy - no PII collected
 */

class AnalyticsClient {
  constructor(config = {}) {
    this.config = {
      analyticsUrl: config.analyticsUrl || 'http://localhost:3001/api/track',
      enabled: config.enabled !== false,
      batchSize: config.batchSize || 10,
      batchTimeout: config.batchTimeout || 30000, // 30 seconds
      optOut: config.optOut || false,
      debug: config.debug || false,
      ...config
    };

    this.queue = [];
    this.sessionId = this.generateId();
    this.userId = this.getOrCreateUserId();
    this.batchTimer = null;
    this.offlineQueue = [];

    // Load offline queue from localStorage
    this.loadOfflineQueue();

    // Track app open
    if (this.config.enabled && !this.config.optOut) {
      this.trackEvent('app_open', {
        platform: this.getPlatform(),
        version: this.getAppVersion()
      });
    }
  }

  /**
   * Track an analytics event
   */
  trackEvent(type, data = {}) {
    if (!this.config.enabled || this.config.optOut) return;

    const event = {
      type,
      platform: data.platform || this.getPlatform(),
      version: data.version || this.getAppVersion(),
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        // Never include PII
        userAgent: navigator.userAgent,
        ...this.getDeviceInfo()
      }
    };

    if (this.config.debug) {
      console.log('[Analytics]', type, event);
    }

    this.queue.push(event);

    // Send immediately if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      // Schedule batch send
      this.batchTimer = setTimeout(() => this.flush(), this.config.batchTimeout);
    }
  }

  /**
   * Track feature usage
   */
  trackFeature(featureName, action = 'use', metadata = {}) {
    const startTime = performance.now();

    return {
      complete: (success = true, duration) => {
        const actualDuration = duration || (performance.now() - startTime);
        this.trackEvent('feature_use', {
          feature_name: featureName,
          feature_action: action,
          duration_ms: Math.round(actualDuration),
          success,
          ...metadata
        });
      }
    };
  }

  /**
   * Track errors/crashes
   */
  trackCrash(error) {
    if (error instanceof Error) {
      this.trackEvent('crash', {
        error_message: error.message,
        stack_trace: error.stack
      });
    } else {
      this.trackEvent('crash', {
        error_message: String(error)
      });
    }
  }

  /**
   * Track geographic information (one-time)
   */
  async trackGeo() {
    try {
      // Only track once per session
      if (this.geoTracked) return;

      const geoData = await this.fetchGeoLocation();
      if (geoData) {
        this.trackEvent('geo_update', geoData);
        this.geoTracked = true;
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Geo tracking failed:', error);
      }
    }
  }

  /**
   * Flush all queued events
   */
  async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.config.batchSize);

    // Try to send
    const success = await this.sendEvents(events);

    if (!success) {
      // Add to offline queue if failed
      this.offlineQueue.push(...events);
      this.saveOfflineQueue();

      if (this.config.debug) {
        console.log('[Analytics] Events queued offline:', this.offlineQueue.length);
      }
    }

    // Continue with remaining events
    if (this.queue.length > 0) {
      this.flush();
    }
  }

  /**
   * Send events to analytics server
   */
  async sendEvents(events) {
    try {
      for (const event of events) {
        const response = await fetch(this.config.analyticsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event),
          timeout: 5000
        });

        if (!response.ok) {
          if (this.config.debug) {
            console.warn('[Analytics] Failed to send event:', response.status);
          }
          return false;
        }
      }

      // Successfully sent offline queue
      if (this.offlineQueue.length > 0) {
        this.offlineQueue = [];
        this.saveOfflineQueue();
        if (this.config.debug) {
          console.log('[Analytics] Offline queue flushed');
        }
      }

      return true;
    } catch (error) {
      if (this.config.debug) {
        console.warn('[Analytics] Send failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Track user activity (periodic call)
   */
  trackActivity() {
    this.trackEvent('app_active', {
      platform: this.getPlatform(),
      version: this.getAppVersion()
    });
  }

  /**
   * Enable or disable analytics
   */
  setOptOut(optOut = true) {
    this.config.optOut = optOut;
    if (optOut) {
      this.queue = [];
      this.offlineQueue = [];
      this.saveOfflineQueue();
    }
  }

  /**
   * Get or create persistent user ID
   */
  getOrCreateUserId() {
    const storageKey = 'openpdf_user_id';

    if (typeof localStorage === 'undefined') {
      return this.generateId();
    }

    try {
      let userId = localStorage.getItem(storageKey);
      if (!userId) {
        userId = this.generateId();
        localStorage.setItem(storageKey, userId);
      }
      return userId;
    } catch (error) {
      return this.generateId();
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get platform info
   */
  getPlatform() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Android')) return 'Android';
    if (typeof window !== 'undefined') return 'Web';

    return 'Unknown';
  }

  /**
   * Get app version (should be updated in actual app)
   */
  getAppVersion() {
    // Try to get from global or package
    if (typeof window !== 'undefined' && window.__APP_VERSION__) {
      return window.__APP_VERSION__;
    }
    return 'unknown';
  }

  /**
   * Get device information (non-PII)
   */
  getDeviceInfo() {
    if (typeof navigator === 'undefined') return {};

    return {
      language: navigator.language,
      timezone: typeof Intl !== 'undefined' ?
        Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown',
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
      screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory
    };
  }

  /**
   * Fetch geographic location using IP
   */
  async fetchGeoLocation() {
    try {
      // Use free IP geolocation service
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 3000
      });

      if (!response.ok) return null;

      const data = await response.json();

      return {
        geo_country_code: data.country_code,
        geo_country: data.country_name,
        geo_region: data.region,
        geo_city: data.city
      };
    } catch (error) {
      if (this.config.debug) {
        console.debug('[Analytics] Could not fetch geo:', error.message);
      }
      return null;
    }
  }

  /**
   * Save offline queue to localStorage
   */
  saveOfflineQueue() {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(
        'openpdf_offline_queue',
        JSON.stringify(this.offlineQueue.slice(0, 100)) // Keep last 100
      );
    } catch (error) {
      if (this.config.debug) {
        console.warn('[Analytics] Could not save offline queue:', error.message);
      }
    }
  }

  /**
   * Load offline queue from localStorage
   */
  loadOfflineQueue() {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem('openpdf_offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
        // Try to flush offline events
        if (this.offlineQueue.length > 0) {
          setTimeout(() => this.sendEvents(this.offlineQueue), 1000);
        }
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn('[Analytics] Could not load offline queue:', error.message);
      }
    }
  }

  /**
   * Send all queued events before closing
   */
  async sendBeforeUnload() {
    await this.flush();
    if (this.offlineQueue.length > 0) {
      await this.sendEvents(this.offlineQueue);
    }
  }
}

// Initialize and export
let analyticsInstance = null;

export function initAnalytics(config) {
  analyticsInstance = new AnalyticsClient(config);

  // Send queued events before unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      analyticsInstance.sendBeforeUnload();
    });
  }

  return analyticsInstance;
}

export function getAnalytics() {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsClient();
  }
  return analyticsInstance;
}

export default AnalyticsClient;
