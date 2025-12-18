/**
 * Performance monitoring and profiling utilities
 * Tracks FPS, memory usage, and rendering metrics
 */

class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastSecond = performance.now();
    
    this.metrics = {
      frameTime: [],
      renderTime: [],
      physicsTime: [],
      gpsUpdateTime: [],
      memoryUsage: 0,
    };
    
    this.maxSamples = 60; // Keep last 60 frames for averaging
    this.enabled = true;
  }

  /**
   * Start timing a frame
   * @returns {number} Frame start time
   */
  frameStart() {
    return performance.now();
  }

  /**
   * End frame timing
   * @param {number} startTime - Frame start time from frameStart()
   */
  frameEnd(startTime) {
    if (!this.enabled) return;
    
    const frameTime = performance.now() - startTime;
    this.metrics.frameTime.push(frameTime);
    
    if (this.metrics.frameTime.length > this.maxSamples) {
      this.metrics.frameTime.shift();
    }
    
    this.frameCount++;
    
    // Update FPS every second
    const now = performance.now();
    if (now - this.lastSecond >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastSecond = now;
      
      // Update memory stats
      if (performance.memory) {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
      }
    }
  }

  /**
   * Record render time (must be called within a frame)
   * @param {number} time - Time taken for rendering in milliseconds
   */
  recordRenderTime(time) {
    if (!this.enabled) return;
    
    this.metrics.renderTime.push(time);
    if (this.metrics.renderTime.length > this.maxSamples) {
      this.metrics.renderTime.shift();
    }
  }

  /**
   * Record physics update time
   * @param {number} time - Time taken for physics in milliseconds
   */
  recordPhysicsTime(time) {
    if (!this.enabled) return;
    
    this.metrics.physicsTime.push(time);
    if (this.metrics.physicsTime.length > this.maxSamples) {
      this.metrics.physicsTime.shift();
    }
  }

  /**
   * Record GPS update time
   * @param {number} time - Time taken for GPS update in milliseconds
   */
  recordGPSUpdateTime(time) {
    if (!this.enabled) return;
    
    this.metrics.gpsUpdateTime.push(time);
    if (this.metrics.gpsUpdateTime.length > this.maxSamples) {
      this.metrics.gpsUpdateTime.shift();
    }
  }

  /**
   * Get average frame time
   * @returns {number} Average in milliseconds
   */
  getAverageFrameTime() {
    if (this.metrics.frameTime.length === 0) return 0;
    const sum = this.metrics.frameTime.reduce((a, b) => a + b, 0);
    return sum / this.metrics.frameTime.length;
  }

  /**
   * Get average render time
   * @returns {number} Average in milliseconds
   */
  getAverageRenderTime() {
    if (this.metrics.renderTime.length === 0) return 0;
    const sum = this.metrics.renderTime.reduce((a, b) => a + b, 0);
    return sum / this.metrics.renderTime.length;
  }

  /**
   * Get average physics time
   * @returns {number} Average in milliseconds
   */
  getAveragePhysicsTime() {
    if (this.metrics.physicsTime.length === 0) return 0;
    const sum = this.metrics.physicsTime.reduce((a, b) => a + b, 0);
    return sum / this.metrics.physicsTime.length;
  }

  /**
   * Get all current metrics as summary object
   * @returns {object} Performance metrics summary
   */
  getMetrics() {
    return {
      fps: this.fps,
      frameTime: {
        avg: this.getAverageFrameTime(),
        max: Math.max(...this.metrics.frameTime, 0),
        min: Math.min(...this.metrics.frameTime, 0),
      },
      renderTime: {
        avg: this.getAverageRenderTime(),
        max: Math.max(...this.metrics.renderTime, 0),
      },
      physicsTime: {
        avg: this.getAveragePhysicsTime(),
        max: Math.max(...this.metrics.physicsTime, 0),
      },
      gpsUpdateTime: {
        avg: this.metrics.gpsUpdateTime.length > 0
          ? this.metrics.gpsUpdateTime.reduce((a, b) => a + b, 0) / this.metrics.gpsUpdateTime.length
          : 0,
      },
      memory: {
        usedMB: this.metrics.memoryUsage,
      },
    };
  }

  /**
   * Get formatted performance stats for display
   * @returns {string} Formatted string for HUD
   */
  getFormattedStats() {
    const metrics = this.getMetrics();
    return `FPS: ${metrics.fps} | Frame: ${metrics.frameTime.avg.toFixed(2)}ms | Memory: ${metrics.memory.usedMB.toFixed(1)}MB`;
  }

  /**
   * Enable/disable performance tracking
   * @param {boolean} enable - Enable or disable
   */
  setEnabled(enable) {
    this.enabled = enable;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      frameTime: [],
      renderTime: [],
      physicsTime: [],
      gpsUpdateTime: [],
      memoryUsage: 0,
    };
    this.fps = 0;
    this.frameCount = 0;
    this.lastSecond = performance.now();
  }
}

// Global singleton instance
let globalMonitor = null;

/**
 * Get or create global performance monitor
 * @returns {PerformanceMonitor} Global monitor instance
 */
export function getPerformanceMonitor() {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}

export { PerformanceMonitor };
export default PerformanceMonitor;
