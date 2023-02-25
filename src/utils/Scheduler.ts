type AsyncFn = (...args: unknown[]) => Promise<unknown>;

export class Scheduler {
  private done = 0;

  private amount = 0;

  private limit: number;

  private queue: AsyncFn[];

  /**
   * 正在执行中的任务
   */
  private tasks: Promise<unknown>[];

  constructor(count: number) {
    this.limit = count;
    this.queue = [];
    this.tasks = [];
  }

  add(task: AsyncFn) {
    if (this.tasks.length < this.limit) {
      this.amount++;
      const promise = task();
      promise.finally(() => {
        this.done++;
        this.tasks.splice(this.tasks.indexOf(promise), 1);
        const nextTask = this.queue.shift();
        if (nextTask) {
          this.add(nextTask);
        }
      });
      this.tasks.push(promise);
    } else {
      this.queue.push(task);
    }
  }

  onFinish(): Promise<void> {
    return new Promise(resolve => {
      const timer = setInterval(() => {
        if (!this.tasks.length && !this.queue.length && this.done === this.amount) {
          resolve();
          clearInterval(timer);
        }
      }, 1000);
    });
  }
}

export async function retryFn<R>(asyncFn: () => Promise<R>, times = 10): Promise<R> {
  try {
    return asyncFn();
  } catch (error) {
    if (times > 0) {
      return retryFn(asyncFn, times - 1);
    }
    throw error;
  }
}
