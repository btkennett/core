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
export interface MemoryStats {
    /** Resident Set Size (MB) — total memory allocated to the process */
    rss: number;
    /** Actually used heap memory (MB) */
    heapUsed: number;
    /** Total heap allocated (MB) */
    heapTotal: number;
    /** External memory usage (MB) */
    external: number;
    /** ArrayBuffer memory usage (MB) */
    arrayBuffers: number;
}
export interface MemoryMonitorConfig {
    /** RSS threshold for warning (MB). Defaults to env or 512 */
    warningThreshold: number;
    /** RSS threshold for critical (MB). Defaults to env or 768 */
    criticalThreshold: number;
    /** How often to check memory (ms). Defaults to env or 60_000 */
    checkInterval: number;
    /** Enable periodic logging. Defaults to true in production */
    enableLogging: boolean;
}
export interface MemoryHealth {
    healthy: boolean;
    stats: MemoryStats;
    warnings: string[];
}
export declare class MemoryMonitor {
    private readonly config;
    private monitoringInterval?;
    private lastWarningTime;
    private readonly warningCooldown;
    private readonly logger;
    constructor(config?: Partial<MemoryMonitorConfig>, logger?: Pick<Console, "log" | "warn">);
    /** Get current memory usage with formatted strings and warnings */
    getMemoryUsage(): {
        stats: MemoryStats;
        formatted: Record<keyof MemoryStats, string>;
        warnings: string[];
    };
    /** Log memory usage, rate-limited by warningCooldown */
    logMemoryUsage(): void;
    /** Start periodic memory monitoring */
    startMonitoring(): void;
    /** Stop periodic memory monitoring */
    stopMonitoring(): void;
    /** Force GC if --expose-gc is enabled */
    forceGarbageCollection(): boolean;
    /** Get health status for /health endpoints */
    getHealthStatus(): MemoryHealth;
}
//# sourceMappingURL=memory-monitor.d.ts.map