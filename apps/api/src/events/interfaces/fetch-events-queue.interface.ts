import type { Job, Queue, Worker } from 'bullmq';

export type DataType = {
	year: number;
};

export type ReturnType = undefined;

export type NameType = `fetch-events-${number}`;

export type QueueType = Queue<DataType, ReturnType, NameType>;

export type JobType = Job<DataType, ReturnType, NameType>;

export type WorkerType = Worker<DataType, ReturnType, NameType>;
