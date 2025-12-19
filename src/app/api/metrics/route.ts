/**
 * Prometheus-compatible metrics endpoint
 *
 * Exposes application metrics in Prometheus format for monitoring
 * Can be scraped by Prometheus, Grafana, or other monitoring tools
 */

export async function GET() {
  const metrics = {
    // Process metrics
    process_uptime_seconds: process.uptime(),
    process_memory_bytes: process.memoryUsage(),

    // Node.js version
    nodejs_version: process.version,

    // Environment
    environment: process.env.NODE_ENV || 'unknown',

    // Timestamp
    timestamp: Date.now(),
  };

  // Simple Prometheus text format
  const prometheusFormat = `
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${metrics.process_uptime_seconds}

# HELP process_memory_rss_bytes Process resident memory in bytes
# TYPE process_memory_rss_bytes gauge
process_memory_rss_bytes ${metrics.process_memory_bytes.rss}

# HELP process_memory_heap_used_bytes Process heap used in bytes
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes ${metrics.process_memory_bytes.heapUsed}

# HELP process_memory_heap_total_bytes Process heap total in bytes
# TYPE process_memory_heap_total_bytes gauge
process_memory_heap_total_bytes ${metrics.process_memory_bytes.heapTotal}
  `.trim();

  return new Response(prometheusFormat, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
    },
  });
}
