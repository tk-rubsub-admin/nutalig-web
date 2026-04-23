import { setupWorker } from 'msw';
import { mockHandlers } from './mockHandlers';

export const worker = setupWorker(...mockHandlers);
