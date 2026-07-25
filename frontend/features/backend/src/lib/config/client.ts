import { ApiClient, type ApiResponse, ApiError } from '@next-feature/client';
import { BACKEND_API_URL } from './env';
import { logger } from '@next-feature/logging/server';

const log = logger.child({ module: 'backend-client' });

/**
 * Centralized API client configuration
 *
 * This file provides a single point to configure:
 * - Base API URL
 * - Request/response interceptors
 * - Default headers
 * - Authentication handling
 */
const apiClient = new ApiClient({
  baseURL: BACKEND_API_URL,
  onAuthenticated: async (config) => {
    try {
      const { auth } = await import('@feature/auth/server');
      const session = await auth();
      const token = session?.user?.jwtToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }


    } catch (error) {
      
    }
    log.info(`${config.method?.toUpperCase()} ${config.url} ${config.data ?? ""}`)
  },
});

const { name, version } = require('../../../package.json');

apiClient.axios.defaults.headers.common['User-Agent'] = `${name}:${version}`;
apiClient.axios.defaults.headers.common['Content-Type'] = 'application/json';

// Re-export commonly used utilities
export { ApiError, type ApiResponse };

// Export configured API client for use in server actions
export default apiClient;
