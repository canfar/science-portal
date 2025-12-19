/**
 * User Registration API Route
 *
 * POST /api/auth/register
 * Creates a new CADC user account
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  fetchExternalApi,
  validateMethod,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

export interface RegistrationRequestPayload {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  institute: string;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/auth/register', 'POST');

  if (!validateMethod(request, ['POST'])) {
    logger.logError(HTTP_STATUS.METHOD_NOT_ALLOWED, 'Method not allowed');
    return methodNotAllowed(['POST']);
  }

  let body: RegistrationRequestPayload;

  try {
    body = await request.json();
    logger.logRequest(request, {
      username: body.username,
      email: body.email,
    });
  } catch (error) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Invalid JSON in request body', error);
    return errorResponse('Invalid JSON in request body', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate required fields
  const requiredFields: Array<keyof RegistrationRequestPayload> = [
    'username',
    'password',
    'firstName',
    'lastName',
    'email',
    'institute',
  ];

  for (const field of requiredFields) {
    if (!body[field] || !body[field].trim()) {
      logger.logError(HTTP_STATUS.BAD_REQUEST, `${field} is required`);
      return errorResponse(`${field} is required`, HTTP_STATUS.BAD_REQUEST);
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Invalid email format');
    return errorResponse('Invalid email format', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate password length
  if (body.password.length < 8) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Password must be at least 8 characters');
    return errorResponse('Password must be at least 8 characters', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate username length
  if (body.username.length < 3) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Username must be at least 3 characters');
    return errorResponse('Username must be at least 3 characters', HTTP_STATUS.BAD_REQUEST);
  }

  // Build CADC user creation payload
  const cadcPayload = {
    userRequest: {
      user: {
        identities: {
          $: [
            {
              identity: {
                '@type': 'HTTP',
                $: body.username.trim(),
              },
            },
          ],
        },
        personalDetails: {
          firstName: { $: body.firstName.trim() },
          lastName: { $: body.lastName.trim() },
          email: { $: body.email.trim() },
          institute: { $: body.institute.trim() },
        },
      },
      password: { $: body.password },
    },
  };

  const externalUrl = serverApiConfig.registration.url;

  // CADC proxy servlet requires these headers to route the request
  const { proxyHeaders: proxyConfig } = serverApiConfig.registration;
  const proxyHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-cadc-proxy_resource_id': proxyConfig.resourceId,
    'x-cadc-proxy_standard_id': proxyConfig.standardId,
    'x-cadc-proxy_auth_type': proxyConfig.authType,
    'x-cadc-proxy_interface_type_id': proxyConfig.interfaceTypeId,
    'x-requested-with': 'XMLHttpRequest',
  };

  // Encode the JSON payload as form data
  // The form field value should contain just the inner userRequest object
  const formData = new URLSearchParams();
  const userRequestJson = JSON.stringify(cadcPayload.userRequest);
  formData.append('userRequest', userRequestJson);

  logger.info('CADC Proxy Headers:', proxyHeaders);
  logger.info('Form data userRequest value:', { userRequestJson });
  logger.logExternalCall(externalUrl, 'PUT', proxyHeaders);
  logger.info('Sending user registration request', {
    username: body.username,
    email: body.email,
  });

  try {
    const response = await fetchExternalApi(
      externalUrl,
      {
        method: 'PUT',
        headers: proxyHeaders,
        body: formData.toString(),
      },
      serverApiConfig.registration.timeout
    );

    if (!response.ok) {
      const statusCode = response.status;
      let errorMessage = 'Failed to create account';

      try {
        const responseText = await response.text();
        logger.info('Error response body', { body: responseText, isEmpty: !responseText });
        logger.info('Response headers', {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
        });

        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
          logger.logExternalResponse(statusCode, response.statusText, errorData);
        } catch {
          // Not JSON, use text as error
          if (responseText && responseText.trim()) {
            errorMessage = responseText;
          } else {
            // Empty response, provide more context
            errorMessage = `Registration failed with status ${statusCode}. The server returned an empty response.`;
          }
          logger.logExternalResponse(statusCode, response.statusText, { text: responseText });
        }
      } catch (error) {
        logger.logExternalResponse(statusCode, response.statusText);
        logger.info('Failed to read error response', { error });

        if (statusCode === HTTP_STATUS.CONFLICT) {
          errorMessage = 'Username already exists';
        } else if (statusCode === HTTP_STATUS.BAD_REQUEST) {
          errorMessage = 'Invalid registration data. Please check all fields.';
        }
      }

      logger.logError(statusCode, errorMessage);
      return errorResponse(errorMessage, statusCode);
    }

    // Success response - CADC returns text, not JSON
    const responseText = await response.text();
    logger.info('Success response from CADC', { body: responseText });
    logger.logSuccess(response.status);

    return NextResponse.json(
      {
        success: true,
        message: responseText || 'Account created successfully! You can now log in with your credentials.',
      },
      { status: response.status }
    );
  } catch (error) {
    logger.logError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create account',
      error
    );
    return errorResponse(
      'Failed to create account. Please try again later.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
});
