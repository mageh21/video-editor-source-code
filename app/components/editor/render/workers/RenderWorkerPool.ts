export interface WorkerTask {
    id: string;
    type: 'decode' | 'encode' | 'effect' | 'composite';
    data: any;
}

export interface WorkerResult {
    id: string;
    result: any;
    error?: Error;
}

export class RenderWorkerPool {
    private workers: Worker[] = [];
    private taskQueue: WorkerTask[] = [];
    private activeJobs = new Map<string, (result: WorkerResult) => void>();
    private workerStatus: boolean[] = [];
    
    constructor(poolSize: number = navigator.hardwareConcurrency || 4) {
        this.initializeWorkers(poolSize);
    }
    
    private initializeWorkers(poolSize: number) {
        for (let i = 0; i < poolSize; i++) {
            const worker = new Worker(
                new URL('./render.worker.ts', import.meta.url),
                { type: 'module' }
            );
            
            this.workerStatus[i] = false; // Not busy
            
            worker.onmessage = (e: MessageEvent<WorkerResult>) => {
                const { id, result, error } = e.data;
                const resolver = this.activeJobs.get(id);
                
                if (resolver) {
                    resolver({ id, result, error });
                    this.activeJobs.delete(id);
                }
                
                // Mark worker as available and process next task
                this.workerStatus[i] = false;
                this.processNextTask();
            };
            
            this.workers.push(worker);
        }
    }
    
    async submitTask(task: WorkerTask): Promise<WorkerResult> {
        return new Promise((resolve) => {
            this.activeJobs.set(task.id, resolve);
            this.taskQueue.push(task);
            this.processNextTask();
        });
    }
    
    private processNextTask() {
        if (this.taskQueue.length === 0) return;
        
        // Find available worker
        const availableWorkerIndex = this.workerStatus.findIndex(busy => !busy);
        if (availableWorkerIndex === -1) return;
        
        const task = this.taskQueue.shift()!;
        this.workerStatus[availableWorkerIndex] = true;
        this.workers[availableWorkerIndex].postMessage(task);
    }
    
    async processBatch<T>(
        items: T[],
        processor: (item: T) => WorkerTask
    ): Promise<WorkerResult[]> {
        const tasks = items.map(processor);
        return Promise.all(tasks.map(task => this.submitTask(task)));
    }
    
    terminate() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.taskQueue = [];
        this.activeJobs.clear();
    }
    
    // Distribute video segments across workers
    async processVideoSegments(
        segments: { start: number; end: number; fileId: string }[]
    ): Promise<Blob[]> {
        const results = await this.processBatch(segments.map((segment, index) => ({ segment, index })), (item) => ({
            id: `segment-${item.index}`,
            type: 'encode',
            data: item.segment
        }));
        
        return results.map(r => r.result as Blob);
    }
}