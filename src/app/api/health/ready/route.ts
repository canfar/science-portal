/**
 * Readiness check endpoint for Kubernetes readiness probe
 * Returns 200 OK if the application is ready to serve traffic
 * Can be extended to check database connections, external APIs, etc.
 */
export async function GET() {
  try {
    // Add checks for critical dependencies here
    // Example: database connection, cache availability, etc.

    const checks = {
      server: true,
      // Add more checks as needed:
      // database: await checkDatabase(),
      // cache: await checkCache(),
    };

    const allHealthy = Object.values(checks).every((check) => check === true);

    if (!allHealthy) {
      return Response.json(
        {
          status: 'degraded',
          checks,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return Response.json(
      {
        status: 'ready',
        checks,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
