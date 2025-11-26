/**
 * Chronicle Monitoring Dashboard
 *
 * Real-time monitoring of chronicle event counts and statistics.
 * Useful for tracking import/deduplication progress.
 */

const CHRONICLE_API = 'http://localhost:3001/api/mcp/chronicle';
const REFRESH_INTERVAL_MS = 5000; // Update every 5 seconds
const TARGET_COUNT = 1507; // Expected final count after deduplication

let previousCount = null;
let startTime = Date.now();

async function getEventStats() {
  try {
    const response = await fetch(CHRONICLE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_timeline_range',
        arguments: {
          start_date: '2020-01-01',
          end_date: '2030-12-31',
          type: 'work_ticket_completed',
          limit: 10000
        }
      })
    });

    const data = await response.json();
    return {
      count: data.data.data.events.length,
      events: data.data.data.events
    };
  } catch (error) {
    return { error: error.message };
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function clearScreen() {
  // ANSI escape code to clear screen and move cursor to top
  process.stdout.write('\x1Bc');
}

function displayDashboard(stats) {
  const elapsed = Date.now() - startTime;
  const elapsedFormatted = formatDuration(elapsed);

  clearScreen();

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           📊 CHRONICLE MONITORING DASHBOARD 📊                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  if (stats.error) {
    console.log('❌ Error connecting to chronicle:');
    console.log(`   ${stats.error}\n`);
    console.log('   Make sure the dashboard backend is running:');
    console.log('   pnpm dev:backend\n');
    return;
  }

  const { count, events } = stats;
  const remaining = count - TARGET_COUNT;
  const progress = ((TARGET_COUNT / count) * 100).toFixed(1);

  // Calculate rate
  let rate = 'N/A';
  let eta = 'N/A';
  if (previousCount !== null && previousCount !== count) {
    const deletedSinceLastCheck = previousCount - count;
    const deletionsPerSecond = deletedSinceLastCheck / (REFRESH_INTERVAL_MS / 1000);
    const deletionsPerMinute = deletionsPerSecond * 60;
    rate = `${Math.abs(deletionsPerMinute).toFixed(0)} events/min`;

    if (deletionsPerMinute > 0 && remaining > 0) {
      const remainingMinutes = remaining / deletionsPerMinute;
      const etaMs = remainingMinutes * 60 * 1000;
      eta = formatDuration(etaMs);
    }
  }

  // Status
  let status = '🔄 Processing';
  let statusColor = '\x1b[33m'; // Yellow
  if (count === TARGET_COUNT) {
    status = '✅ Complete';
    statusColor = '\x1b[32m'; // Green
  } else if (count < TARGET_COUNT) {
    status = '⚠️  Over-deduplicated';
    statusColor = '\x1b[31m'; // Red
  }

  console.log(`${statusColor}Status:${'\x1b[0m'} ${status}`);
  console.log(`Elapsed: ${elapsedFormatted}\n`);

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ EVENTS                                                      │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ Current count:    ${count.toString().padStart(6)} events                          │`);
  console.log(`│ Target count:     ${TARGET_COUNT.toString().padStart(6)} unique tickets                  │`);
  console.log(`│ Remaining:        ${remaining.toString().padStart(6)} duplicates to remove            │`);
  console.log(`│ Progress:         ${progress.toString().padStart(6)}%                                │`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ PERFORMANCE                                                 │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ Rate:             ${rate.padEnd(30)}             │`);
  console.log(`│ ETA:              ${eta.padEnd(30)}             │`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // Recent activity
  if (previousCount !== null) {
    const change = previousCount - count;
    if (change > 0) {
      console.log(`🗑️  Deleted ${change} events in the last ${REFRESH_INTERVAL_MS / 1000}s`);
    } else if (change < 0) {
      console.log(`📥 Added ${Math.abs(change)} events in the last ${REFRESH_INTERVAL_MS / 1000}s`);
    } else {
      console.log(`⏸️  No changes in the last ${REFRESH_INTERVAL_MS / 1000}s`);
    }
  }

  console.log(`\n⏱️  Last updated: ${new Date().toLocaleTimeString()}`);
  console.log('   Press Ctrl+C to exit');

  previousCount = count;
}

async function monitor() {
  console.log('Starting Chronicle Monitor...\n');

  // Initial fetch
  const stats = await getEventStats();
  displayDashboard(stats);

  // Set up interval
  setInterval(async () => {
    const stats = await getEventStats();
    displayDashboard(stats);
  }, REFRESH_INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitor stopped');
  process.exit(0);
});

monitor().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
