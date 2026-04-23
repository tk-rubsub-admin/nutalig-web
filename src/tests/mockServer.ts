import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { mockHandlers } from './mockHandlers';

const server = setupServer(...mockHandlers);
export { server, rest };
