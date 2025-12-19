/**
 * HTTP Status Codes
 *
 * Standard HTTP status codes used throughout the API.
 * Using named constants instead of magic numbers for better maintainability.
 */

export const HTTP_STATUS = {
  // Success responses (2xx)
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client error responses (4xx)
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server error responses (5xx)
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

/**
 * HTTP Status Code Names
 * Maps status codes to their human-readable names
 */
export const HTTP_STATUS_NAMES: Record<number, string> = {
  [HTTP_STATUS.OK]: 'OK',
  [HTTP_STATUS.CREATED]: 'Created',
  [HTTP_STATUS.ACCEPTED]: 'Accepted',
  [HTTP_STATUS.NO_CONTENT]: 'No Content',
  [HTTP_STATUS.BAD_REQUEST]: 'Bad Request',
  [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized',
  [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'Not Found',
  [HTTP_STATUS.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [HTTP_STATUS.REQUEST_TIMEOUT]: 'Request Timeout',
  [HTTP_STATUS.CONFLICT]: 'Conflict',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HTTP_STATUS.BAD_GATEWAY]: 'Bad Gateway',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HTTP_STATUS.GATEWAY_TIMEOUT]: 'Gateway Timeout',
} as const;

/**
 * API Timeout Constants (in milliseconds)
 */
export const API_TIMEOUTS = {
  DEFAULT: 30000,      // 30 seconds
  SHORT: 10000,        // 10 seconds
  LONG: 60000,         // 60 seconds
  VERY_LONG: 120000,   // 2 minutes
} as const;
