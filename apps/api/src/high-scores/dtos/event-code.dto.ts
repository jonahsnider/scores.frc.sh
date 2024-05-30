import { z } from 'zod';

export const EventCode = z.string().min(1).toUpperCase();
