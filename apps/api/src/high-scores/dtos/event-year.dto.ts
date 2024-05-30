import { z } from 'zod';
import { YEAR_NEWEST, YEAR_OLDEST } from '../../cache-manager/cache-manager.constants';

export const EventYear = z.number().int().min(YEAR_OLDEST).max(YEAR_NEWEST);
