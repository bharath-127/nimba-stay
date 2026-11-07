import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Normalised error thrown by every service call.
 * `status` is 0 when the server could not be reached at all.
 */
export class ApiError extends Error {
  constructor({ status, code, message, details = [] }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isConflict() {
    return this.status === 409;
  }

  get isValidation() {
    return this.status === 400;
  }

  /** `{ fieldName: message }` for server-side validation details. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Unwrap the `{ success, data }` envelope on success and turn every failure
// into an ApiError, so hooks and components never inspect raw axios errors.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const body = error.response.data?.error ?? {};
      return Promise.reject(
        new ApiError({
          status: error.response.status,
          code: body.code ?? 'HTTP_ERROR',
          message: body.message ?? `Request failed with status ${error.response.status}`,
          details: body.details ?? [],
        })
      );
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ApiError({ status: 0, code: 'TIMEOUT', message: 'The server took too long to respond. Please try again.' })
      );
    }
    return Promise.reject(
      new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Cannot reach the Nimba Stay server. Check that the API is running and try again.',
      })
    );
  }
);
