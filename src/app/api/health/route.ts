/**
 * Health check endpoint for Kubernetes liveness probe
 * Returns 200 OK if the application is running
 */
export async function GET() {
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
