import type { Job, Queue, Worker } from 'bullmq';

export type DataType = {
	year: number;
	eventCode: string;
	eventWeekNumber: number;
};

export type ReturnType = undefined;

export type NameType = `fetch-match-results-${number}-${string}`;

export type QueueType = Queue<DataType, ReturnType, NameType>;

export type JobType = Job<DataType, ReturnType, NameType>;

export type WorkerType = Worker<DataType, ReturnType, NameType>;
