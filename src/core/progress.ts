import { SearchProgress } from './types.js';
import { EventEmitter } from 'events';

export interface ProgressReporter extends EventEmitter {
  on(event: 'progress', listener: (progress: SearchProgress) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'complete', listener: (summary: SearchSummary) => void): this;
}

export interface SearchSummary {
  totalFilesSearched: number;
  totalMatchesFound: number;
  searchDuration: number;
  averageFileProcessingTime: number;
  errors: Error[];
}

export class ProgressTracker extends EventEmitter implements ProgressReporter {
  private startTime: number;
  private fileProcessingTimes: number[] = [];
  private errors: Error[] = [];
  private lastProgressUpdate: number = 0;
  private updateInterval: number = 100; // ms

  constructor(updateInterval: number = 100) {
    super();
    this.updateInterval = updateInterval;
    this.startTime = Date.now();
  }

  /**
   * Report progress update
   */
  reportProgress(progress: SearchProgress): void {
    const now = Date.now();
    
    // Throttle updates to avoid overwhelming listeners
    if (now - this.lastProgressUpdate >= this.updateInterval) {
      this.emit('progress', {
        ...progress,
        elapsedTime: now - this.startTime,
        estimatedTimeRemaining: this.estimateTimeRemaining(progress),
      });
      this.lastProgressUpdate = now;
    }
  }

  /**
   * Report an error during search
   */
  reportError(error: Error): void {
    this.errors.push(error);
    this.emit('error', error);
  }

  /**
   * Mark file processing complete
   */
  fileProcessed(processingTime: number): void {
    this.fileProcessingTimes.push(processingTime);
  }

  /**
   * Complete the search and emit summary
   */
  complete(totalMatches: number): void {
    const summary: SearchSummary = {
      totalFilesSearched: this.fileProcessingTimes.length,
      totalMatchesFound: totalMatches,
      searchDuration: Date.now() - this.startTime,
      averageFileProcessingTime: this.calculateAverageProcessingTime(),
      errors: this.errors,
    };

    this.emit('complete', summary);
  }

  /**
   * Estimate remaining time based on current progress
   */
  private estimateTimeRemaining(progress: SearchProgress): number | undefined {
    if (progress.filesProcessed === 0 || !progress.totalFiles) {
      return undefined;
    }

    const elapsedTime = Date.now() - this.startTime;
    const timePerFile = elapsedTime / progress.filesProcessed;
    const remainingFiles = progress.totalFiles - progress.filesProcessed;
    
    return Math.round(timePerFile * remainingFiles);
  }

  /**
   * Calculate average file processing time
   */
  private calculateAverageProcessingTime(): number {
    if (this.fileProcessingTimes.length === 0) return 0;
    
    const sum = this.fileProcessingTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fileProcessingTimes.length);
  }
}

/**
 * Console progress reporter for CLI usage
 */
export class ConsoleProgressReporter {
  private tracker: ProgressTracker;
  private showProgress: boolean;
  private lastLine: string = '';

  constructor(showProgress: boolean = true) {
    this.showProgress = showProgress;
    this.tracker = new ProgressTracker();
    
    if (this.showProgress) {
      this.setupListeners();
    }
  }

  private setupListeners(): void {
    this.tracker.on('progress', (progress) => {
      this.displayProgress(progress);
    });

    this.tracker.on('error', (error) => {
      this.clearLine();
      console.error(`Error: ${error.message}`);
    });

    this.tracker.on('complete', (summary) => {
      this.clearLine();
      this.displaySummary(summary);
    });
  }

  private displayProgress(progress: SearchProgress & { elapsedTime?: number; estimatedTimeRemaining?: number }): void {
    const percentage = progress.totalFiles > 0 
      ? Math.round((progress.filesProcessed / progress.totalFiles) * 100)
      : 0;

    const progressBar = this.createProgressBar(percentage);
    const timeInfo = progress.estimatedTimeRemaining 
      ? ` ETA: ${this.formatTime(progress.estimatedTimeRemaining)}`
      : '';

    const line = `Searching: ${progressBar} ${percentage}% (${progress.filesProcessed}/${progress.totalFiles})${timeInfo}`;
    
    this.updateLine(line);
  }

  private displaySummary(summary: SearchSummary): void {
    console.log(`\nSearch completed in ${this.formatTime(summary.searchDuration)}`);
    console.log(`Files searched: ${summary.totalFilesSearched}`);
    console.log(`Matches found: ${summary.totalMatchesFound}`);
    
    if (summary.errors.length > 0) {
      console.log(`Errors encountered: ${summary.errors.length}`);
    }
  }

  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  private updateLine(line: string): void {
    this.clearLine();
    process.stdout.write(line);
    this.lastLine = line;
  }

  private clearLine(): void {
    if (this.lastLine) {
      process.stdout.write('\r' + ' '.repeat(this.lastLine.length) + '\r');
      this.lastLine = '';
    }
  }

  getTracker(): ProgressTracker {
    return this.tracker;
  }
}

/**
 * Create a progress reporter for different environments
 */
export function createProgressReporter(options: {
  type?: 'console' | 'silent' | 'custom';
  showProgress?: boolean;
  updateInterval?: number;
}): ProgressTracker {
  switch (options.type) {
    case 'console':
      const consoleReporter = new ConsoleProgressReporter(options.showProgress ?? true);
      return consoleReporter.getTracker();
    
    case 'silent':
      return new ProgressTracker(options.updateInterval);
    
    case 'custom':
    default:
      return new ProgressTracker(options.updateInterval);
  }
}