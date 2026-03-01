/**
 * Memory Monitor — Production Memory Visibility
 *
 * Extracted from fn-forge. Tracks memory usage with configurable
 * warning/critical thresholds and periodic monitoring.
 *
 * Features:
 * - RSS and heap threshold alerts with cooldowns
 * - Health status for /health endpoints
 * - Optional periodic monitoring interval
 * - Force GC support (when --expose-gc is enabled)
 */
export class MemoryMonitor {
    config;
    monitoringInterval;
    lastWarningTime = 0;
    warningCooldown = 30_000;
    logger;
    constructor(config = {}, logger) {
        this.logger = logger ?? console;
        this.config = {
            warningThreshold: config.warningThreshold ?? 512,
            criticalThreshold: config.criticalThreshold ?? 768,
            checkInterval: config.checkInterval ?? 60_000,
            enableLogging: config.enableLogging ?? true,
        };
    }
    /** Get current memory usage with formatted strings and warnings */
    getMemoryUsage() {
        const raw = process.memoryUsage();
        const toMB = (bytes) => Math.round(bytes / 1024 / 1024);
        const stats = {
            rss: toMB(raw.rss),
            heapUsed: toMB(raw.heapUsed),
            heapTotal: toMB(raw.heapTotal),
            external: toMB(raw.external),
            arrayBuffers: toMB(raw.arrayBuffers),
        };
        const formatted = Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, `${v}MB`]));
        const warnings = [];
        if (stats.rss >= this.config.criticalThreshold) {
            warnings.push(`CRITICAL: RSS ${stats.rss}MB >= ${this.config.criticalThreshold}MB`);
        }
        else if (stats.rss >= this.config.warningThreshold) {
            warnings.push(`WARNING: RSS ${stats.rss}MB >= ${this.config.warningThreshold}MB`);
        }
        if (stats.heapUsed >= this.config.criticalThreshold * 0.8) {
            warnings.push(`CRITICAL: Heap ${stats.heapUsed}MB >= 80% of critical threshold`);
        }
        else if (stats.heapUsed >= this.config.warningThreshold * 0.8) {
            warnings.push(`WARNING: Heap ${stats.heapUsed}MB >= 80% of warning threshold`);
        }
        return { stats, formatted, warnings };
    }
    /** Log memory usage, rate-limited by warningCooldown */
    logMemoryUsage() {
        const { formatted, warnings } = this.getMemoryUsage();
        if (warnings.length > 0) {
            const now = Date.now();
            if (now - this.lastWarningTime >= this.warningCooldown) {
                this.logger.warn(`[Memory] RSS: ${formatted.rss}, Heap: ${formatted.heapUsed}/${formatted.heapTotal}`);
                for (const w of warnings)
                    this.logger.warn(`  ${w}`);
                this.lastWarningTime = now;
            }
        }
        else if (this.config.enableLogging) {
            this.logger.log(`[Memory] RSS: ${formatted.rss}, Heap: ${formatted.heapUsed}/${formatted.heapTotal}, External: ${formatted.external}`);
        }
    }
    /** Start periodic memory monitoring */
    startMonitoring() {
        if (this.monitoringInterval)
            return;
        this.monitoringInterval = setInterval(() => this.logMemoryUsage(), this.config.checkInterval);
        // Don't prevent graceful shutdown
        this.monitoringInterval.unref();
        this.logMemoryUsage();
    }
    /** Stop periodic memory monitoring */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
    }
    /** Force GC if --expose-gc is enabled */
    forceGarbageCollection() {
        if (typeof globalThis.gc === "function") {
            globalThis.gc();
            return true;
        }
        return false;
    }
    /** Get health status for /health endpoints */
    getHealthStatus() {
        const { stats, warnings } = this.getMemoryUsage();
        return {
            healthy: stats.rss < this.config.criticalThreshold &&
                stats.heapUsed < this.config.criticalThreshold * 0.8,
            stats,
            warnings,
        };
    }
}
//# sourceMappingURL=memory-monitor.js.map