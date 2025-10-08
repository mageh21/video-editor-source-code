interface PerformanceMetric {
    operation: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric[]> = new Map();
    private activeOperations: Map<string, PerformanceMetric> = new Map();
    private enabled: boolean = true;
    
    constructor(enabled: boolean = true) {
        this.enabled = enabled;
        
        // Monitor memory usage periodically
        if (this.enabled && 'memory' in performance) {
            setInterval(() => {
                this.recordMemoryUsage();
            }, 5000);
        }
    }
    
    start(operation: string, metadata?: Record<string, any>): void {
        if (!this.enabled) return;
        
        const metric: PerformanceMetric = {
            operation,
            startTime: performance.now(),
            metadata
        };
        
        this.activeOperations.set(operation, metric);
    }
    
    end(operation: string): number | null {
        if (!this.enabled) return null;
        
        const metric = this.activeOperations.get(operation);
        if (!metric) {
            console.warn(`No active operation found: ${operation}`);
            return null;
        }
        
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
        
        // Store completed metric
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        this.metrics.get(operation)!.push(metric);
        
        // Clean up
        this.activeOperations.delete(operation);
        
        // Log if operation took too long
        if (metric.duration > 1000) {
            console.warn(`Slow operation detected: ${operation} took ${metric.duration.toFixed(2)}ms`);
        }
        
        return metric.duration;
    }
    
    async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
        this.start(operation);
        try {
            const result = await fn();
            this.end(operation);
            return result;
        } catch (error) {
            this.end(operation);
            throw error;
        }
    }
    
    getAverageTime(operation: string): number | null {
        const metrics = this.metrics.get(operation);
        if (!metrics || metrics.length === 0) return null;
        
        const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
        return total / metrics.length;
    }
    
    getMetrics(operation?: string): Record<string, any> {
        if (operation) {
            const metrics = this.metrics.get(operation) || [];
            return {
                operation,
                count: metrics.length,
                avgTime: this.getAverageTime(operation),
                minTime: Math.min(...metrics.map(m => m.duration || 0)),
                maxTime: Math.max(...metrics.map(m => m.duration || 0)),
                totalTime: metrics.reduce((sum, m) => sum + (m.duration || 0), 0)
            };
        }
        
        // Return all metrics
        const allMetrics: Record<string, any> = {};
        this.metrics.forEach((metrics, op) => {
            allMetrics[op] = this.getMetrics(op);
        });
        
        return allMetrics;
    }
    
    private recordMemoryUsage(): void {
        if (!('memory' in performance)) return;
        
        const memory = (performance as any).memory;
        const usage = {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
        
        this.start('memory-usage', usage);
        this.end('memory-usage');
        
        // Warn if memory usage is high
        if (usage.percentUsed > 80) {
            console.warn(`High memory usage: ${usage.percentUsed.toFixed(1)}%`);
        }
    }
    
    clear(): void {
        this.metrics.clear();
        this.activeOperations.clear();
    }
    
    exportMetrics(): string {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            activeOperations: Array.from(this.activeOperations.keys())
        };
        
        return JSON.stringify(data, null, 2);
    }
    
    // Specific performance helpers
    measureFrameRate(callback: () => void): () => void {
        if (!this.enabled) {
            callback();
            return () => {};
        }
        
        let frameCount = 0;
        let lastTime = performance.now();
        let animationId: number;
        
        const measureFrame = () => {
            const currentTime = performance.now();
            frameCount++;
            
            // Calculate FPS every second
            if (currentTime - lastTime >= 1000) {
                const fps = frameCount;
                this.start('frame-rate', { fps });
                this.end('frame-rate');
                
                frameCount = 0;
                lastTime = currentTime;
                
                if (fps < 30) {
                    console.warn(`Low frame rate detected: ${fps} FPS`);
                }
            }
            
            callback();
            animationId = requestAnimationFrame(measureFrame);
        };
        
        animationId = requestAnimationFrame(measureFrame);
        
        // Return cleanup function
        return () => cancelAnimationFrame(animationId);
    }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor(
    process.env.NODE_ENV === 'development'
);

// React hook for performance monitoring
export function usePerformanceMonitor(operationName: string) {
    return {
        start: (metadata?: Record<string, any>) => performanceMonitor.start(operationName, metadata),
        end: () => performanceMonitor.end(operationName),
        measure: <T>(fn: () => Promise<T>) => performanceMonitor.measure(operationName, fn)
    };
}

// Export types
export type { PerformanceMetric };
export { PerformanceMonitor };