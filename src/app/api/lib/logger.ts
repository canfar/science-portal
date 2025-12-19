/**
 * API Logger Utility
 *
 * Provides structured logging for API routes with request/response details.
 */

import { NextRequest } from 'next/server';

export interface LogContext {
  route: string;
  method: string;
  timestamp: string;
}

export class ApiLogger {
  private context: LogContext;

  constructor(route: string, method: string) {
    this.context = {
      route,
      method,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Log incoming request with headers and body
   */
  logRequest(request: NextRequest, body?: any) {
    console.log('\n' + '='.repeat(80));
    console.log(`📥 INCOMING REQUEST: ${this.context.method} ${this.context.route}`);
    console.log('='.repeat(80));
    console.log(`⏰ Timestamp: ${this.context.timestamp}`);
    console.log(`🔗 URL: ${request.url}`);

    // Log headers (mask sensitive data)
    console.log('\n📋 Headers:');
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'cookie' || key.toLowerCase() === 'authorization') {
        headers[key] = value ? `${value.substring(0, 20)}...` : '<empty>';
      } else {
        headers[key] = value;
      }
    });
    console.log(JSON.stringify(headers, null, 2));

    // Log cookies separately for visibility
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      console.log('\n🍪 Cookies:');
      const cookies = cookieHeader.split(';').map(c => c.trim());
      cookies.forEach(cookie => {
        const [name, ...valueParts] = cookie.split('=');
        const value = valueParts.join('=');
        console.log(`  - ${name}: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
      });
    }

    // Log body if provided
    if (body !== undefined) {
      console.log('\n📦 Request Body:');
      if (typeof body === 'object') {
        // Mask password fields
        const sanitized = { ...body };
        if (sanitized.password) {
          sanitized.password = '***REDACTED***';
        }
        console.log(JSON.stringify(sanitized, null, 2));
      } else {
        console.log(body);
      }
    }
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Log external API call
   */
  logExternalCall(url: string, method: string, headers?: Record<string, any>) {
    console.log('\n' + '-'.repeat(80));
    console.log(`🌐 EXTERNAL API CALL: ${method} ${url}`);
    console.log('-'.repeat(80));

    if (headers) {
      console.log('\n📋 Headers being sent:');
      const sanitized = { ...headers };
      if (sanitized.Cookie) {
        sanitized.Cookie = `${sanitized.Cookie.substring(0, 30)}...`;
      }
      console.log(JSON.stringify(sanitized, null, 2));
    }
    console.log('-'.repeat(80) + '\n');
  }

  /**
   * Log external API response
   */
  logExternalResponse(status: number, statusText: string, data?: any) {
    console.log('\n' + '-'.repeat(80));
    console.log(`📡 EXTERNAL API RESPONSE`);
    console.log('-'.repeat(80));
    console.log(`📊 Status: ${status} ${statusText}`);

    if (data !== undefined) {
      console.log('\n📦 Response Data:');
      if (data === null) {
        console.log('null');
      } else if (typeof data === 'object') {
        // Mask sensitive fields
        const sanitized = JSON.parse(JSON.stringify(data));
        if (sanitized.password) sanitized.password = '***REDACTED***';
        if (sanitized.token) sanitized.token = `${sanitized.token.substring(0, 20)}...`;
        console.log(JSON.stringify(sanitized, null, 2));
      } else {
        console.log(data);
      }
    }
    console.log('-'.repeat(80) + '\n');
  }

  /**
   * Log successful response
   */
  logSuccess(statusCode: number, data?: any) {
    console.log('\n' + '='.repeat(80));
    console.log(`✅ SUCCESS RESPONSE: ${this.context.method} ${this.context.route}`);
    console.log('='.repeat(80));
    console.log(`📊 Status: ${statusCode}`);

    if (data !== undefined) {
      console.log('\n📦 Response Data:');
      if (data === null) {
        console.log('null');
      } else if (typeof data === 'object') {
        // Mask sensitive fields
        const sanitized = JSON.parse(JSON.stringify(data));
        if (sanitized.password) sanitized.password = '***REDACTED***';
        if (sanitized.token) sanitized.token = `${sanitized.token.substring(0, 20)}...`;
        console.log(JSON.stringify(sanitized, null, 2));
      } else {
        console.log(data);
      }
    }

    const duration = Date.now() - new Date(this.context.timestamp).getTime();
    console.log(`\n⏱️  Duration: ${duration}ms`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Log error response
   */
  logError(statusCode: number, error: string | Error, details?: any) {
    console.log('\n' + '='.repeat(80));
    console.log(`❌ ERROR RESPONSE: ${this.context.method} ${this.context.route}`);
    console.log('='.repeat(80));
    console.log(`📊 Status: ${statusCode}`);
    console.log(`💥 Error: ${error instanceof Error ? error.message : error}`);

    if (error instanceof Error && error.stack) {
      console.log('\n📚 Stack Trace:');
      console.log(error.stack);
    }

    if (details !== undefined) {
      console.log('\n📝 Additional Details:');
      console.log(JSON.stringify(details, null, 2));
    }

    const duration = Date.now() - new Date(this.context.timestamp).getTime();
    console.log(`\n⏱️  Duration: ${duration}ms`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Log a general info message
   */
  info(message: string, data?: any) {
    console.log(`ℹ️  [${this.context.route}] ${message}`);
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any) {
    console.warn(`⚠️  [${this.context.route}] ${message}`);
    if (data !== undefined) {
      console.warn(JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Create a logger instance for an API route
 */
export function createLogger(route: string, method: string): ApiLogger {
  return new ApiLogger(route, method);
}
