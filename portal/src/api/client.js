// The single swap point between mock and real backend.
// Phase 0.5: mock. From Phase 8: set VITE_API_BASE and every screen talks to Azure Functions.
import { mockApi, _setMockUser } from './mockApi.js';
import { httpApi } from './httpApi.js';

export const USING_MOCK = !import.meta.env.VITE_API_BASE;
export const api = USING_MOCK ? mockApi : httpApi;
export const setMockUser = _setMockUser;
