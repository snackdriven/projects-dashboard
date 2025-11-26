/**
 * JIRA Deduplication Script
 *
 * Removes duplicate work_ticket_completed events from chronicle.
 * Uses parallel processing with batches of concurrent requests for optimal performance.
 */

const CHRONICLE_API = 'http://localhost:3001/api/mcp/chronicle';
const CONCURRENCY = 50; // Process 50 deletions in parallel
const DELAY_BETWEEN_BATCHES_MS = 100; // Small delay between batches

async function getAllWorkTickets() {
  console.log('🔍 Fetching all work tickets from chronicle...');

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
  return data.data.data.events;
}

async function deleteEvent(eventId) {
  const response = await fetch(CHRONICLE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'delete_event',
      arguments: {
        event_id: eventId
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
}

async function main() {
  const startTime = Date.now();
  console.log('🧹 JIRA Deduplication Tool\n');

  // Fetch all events
  const events = await getAllWorkTickets();
  console.log(`📊 Total events: ${events.length}\n`);

  // Group by ticket_key
  const byTicketKey = new Map();
  for (const event of events) {
    const ticketKey = event.metadata.ticket_key;
    if (!byTicketKey.has(ticketKey)) {
      byTicketKey.set(ticketKey, []);
    }
    byTicketKey.get(ticketKey).push(event);
  }

  console.log(`🎫 Unique tickets: ${byTicketKey.size}`);

  // Find duplicates
  const duplicates = [];
  for (const [ticketKey, ticketEvents] of byTicketKey.entries()) {
    if (ticketEvents.length > 1) {
      // Keep the first one, mark the rest as duplicates
      duplicates.push(...ticketEvents.slice(1));
      console.log(`  🔄 ${ticketKey}: ${ticketEvents.length} copies (removing ${ticketEvents.length - 1})`);
    }
  }

  console.log(`\n❌ Duplicates to remove: ${duplicates.length}`);
  console.log(`⚡ Using ${CONCURRENCY} concurrent deletions per batch\n`);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  // Confirm deletion
  console.log('⚠️  About to delete duplicate events. Press Ctrl+C to cancel...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Delete duplicates in parallel batches
  console.log('🗑️  Deleting duplicates...\n');
  let deleted = 0;
  let failed = 0;
  const errors = [];

  // Process in batches
  for (let i = 0; i < duplicates.length; i += CONCURRENCY) {
    const chunk = duplicates.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(duplicates.length / CONCURRENCY);
    const progress = ((i / duplicates.length) * 100).toFixed(1);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${progress}% complete) - ${chunk.length} events in parallel`);

    // Use Promise.allSettled to handle all requests in parallel
    const results = await Promise.allSettled(
      chunk.map(event => deleteEvent(event.id))
    );

    // Process results
    results.forEach((result, idx) => {
      const event = chunk[idx];
      if (result.status === 'fulfilled') {
        deleted++;
        process.stdout.write('✓');
      } else {
        failed++;
        errors.push({
          ticket: event.metadata.ticket_key,
          event_id: event.id,
          error: result.reason.message
        });
        process.stdout.write('✗');
      }
    });

    process.stdout.write('\n');

    // Small delay between batches to avoid overwhelming the API
    if (i + CONCURRENCY < duplicates.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = (deleted / (elapsedTime / 60)).toFixed(0);

  console.log(`\n✅ Deduplication complete!`);
  console.log(`   Time: ${elapsedTime}s`);
  console.log(`   Rate: ${rate} deletions/minute`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Remaining events: ${events.length - deleted}`);

  // Report errors if any
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors occurred:`);
    errors.slice(0, 10).forEach(err => {
      console.log(`   ✗ ${err.ticket} (${err.event_id}): ${err.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
