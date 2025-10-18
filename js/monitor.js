/**
 * RumahSubsidi.id - Performance Monitoring
 * Tracks Core Web Vitals
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    enabled: true,
    sampleRate: 1.0, // 100% of users
    debug: false,
    endpoint: '/api/analytics' // Ganti dengan endpoint Anda
  };

  // Performance Monitor Class
  class PerformanceMonitor {
    constructor() {
      this.metrics = {};
      if (CONFIG.enabled && Math.random() <= CONFIG.sampleRate) {
        this.init();
      }
    }

    init() {
      this.trackCoreWebVitals();
      this.trackPageLoad();
      this.trackErrors();
    }

    // Track Core Web Vitals
    trackCoreWebVitals() {
      // LCP - Largest Contentful Paint
      this.observeLCP();
      
      // FID - First Input Delay
      this.observeFID();
      
      // CLS - Cumulative Layout Shift
      this.observeCLS();
      
      // FCP - First Contentful Paint
      this.observeFCP();
    }

    observeLCP() {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
          
          if (CONFIG.debug) {
            console.log('LCP:', this.metrics.lcp);
          }
          
          this.sendMetric('lcp', this.metrics.lcp);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.error('LCP observation failed:', e);
      }
    }

    observeFID() {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            
            if (CONFIG.debug) {
              console.log('FID:', this.metrics.fid);
            }
            
            this.sendMetric('fid', this.metrics.fid);
          });
        });

        observer.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.error('FID observation failed:', e);
      }
    }

    observeCLS() {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          
          this.metrics.cls = clsValue;
          
          if (CONFIG.debug) {
            console.log('CLS:', this.metrics.cls);
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Send CLS when user leaves
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            this.sendMetric('cls', this.metrics.cls);
          }
        });
      } catch (e) {
        console.error('CLS observation failed:', e);
      }
    }

    observeFCP() {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              
              if (CONFIG.debug) {
                console.log('FCP:', this.metrics.fcp);
              }
              
              this.sendMetric('fcp', this.metrics.fcp);
            }
          });
        });

        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.error('FCP observation failed:', e);
      }
    }

    // Track Page Load
    trackPageLoad() {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          
          if (!perfData) return;

          const metrics = {
            dns: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcp: perfData.connectEnd - perfData.connectStart,
            request: perfData.responseStart - perfData.requestStart,
            response: perfData.responseEnd - perfData.responseStart,
            dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            load: perfData.loadEventEnd - perfData.loadEventStart,
            total: perfData.loadEventEnd - perfData.fetchStart
          };

          this.metrics.navigation = metrics;
          
          if (CONFIG.debug) {
            console.log('Page Load Timing:', metrics);
          }

          this.sendMetric('navigation', metrics);
        }, 0);
      });
    }

    // Track Errors
    trackErrors() {
      window.addEventListener('error', (event) => {
        const errorData = {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: Date.now(),
          url: window.location.href
        };

        if (CONFIG.debug) {
          console.error('Error tracked:', errorData);
        }

        this.sendMetric('error', errorData);
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const errorData = {
          reason: event.reason,
          timestamp: Date.now(),
          url: window.location.href
        };

        if (CONFIG.debug) {
          console.error('Unhandled rejection:', errorData);
        }

        this.sendMetric('unhandledRejection', errorData);
      });
    }

    // Send Metric
    sendMetric(name, value) {
      // Send to Google Analytics if available
      if (typeof gtag === 'function') {
        gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: name,
          value: Math.round(typeof value === 'number' ? value : 0),
          non_interaction: true
        });
      }

      // Send to custom endpoint (optional)
      if (navigator.sendBeacon && CONFIG.endpoint) {
        const data = JSON.stringify({
          metric: name,
          value: value,
          url: window.location.href,
          timestamp: Date.now()
        });

        navigator.sendBeacon(CONFIG.endpoint, data);
      }

      // Log to console in debug mode
      if (CONFIG.debug) {
        console.log(`Metric [${name}]:`, value);
      }
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new PerformanceMonitor();
    });
  } else {
    new PerformanceMonitor();
  }

  // Export for debugging
  window.PerformanceMonitor = PerformanceMonitor;

})();