/**
 * JIRA History Import Script
 *
 * Imports historical JIRA ticket data from CSV export into chronicle timeline.
 * Creates work_ticket_completed events for all resolved/done tickets.
 *
 * Usage: node scripts/import-jira-history.js "path/to/jira.csv"
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';

const CHRONICLE_API = 'http://localhost:3001/api/mcp/chronicle';
const CONCURRENCY = 10; // Process 10 events in parallel
const DELAY_MS = 50; // 50ms delay between batches (reduced from 100ms)

/**
 * Parse CSV and convert to timeline events
 */
function parseJiraCSV(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`📊 Parsed ${records.length} tickets from CSV`);

  const events = [];
  let skipped = 0;

  for (const record of records) {
    // Only import completed/resolved tickets
    const status = record['Status'];
    const resolution = record['Resolution'];
    const resolved = record['Resolved'];
    const updated = record['Updated'];

    // Skip if no status
    if (!status || status === '') {
      skipped++;
      continue;
    }

    // Determine if ticket is complete
    const isDone = status === 'Done' ||
                   status === 'Closed' ||
                   status === 'Resolved' ||
                   resolution === 'Done' ||
                   resolution === 'Fixed' ||
                   resolution === 'Completed';

    if (!isDone) {
      skipped++;
      continue;
    }

    // Use Updated date as fallback if Resolved is missing
    const timestamp = resolved || updated;

    if (!timestamp) {
      console.warn(`⚠️  Skipping ${record['Issue key']}: No timestamp`);
      skipped++;
      continue;
    }

    // Parse labels (multiple columns: Labels, Labels, Labels, ...)
    const labels = [];
    for (let i = 1; i <= 10; i++) {
      const labelKey = i === 1 ? 'Labels' : `Labels.${i}`;
      if (record[labelKey]) {
        labels.push(record[labelKey]);
      }
    }

    // Parse components (multiple columns: Components, Components, ...)
    const components = [];
    for (let i = 1; i <= 10; i++) {
      const compKey = i === 1 ? 'Components' : `Components.${i}`;
      if (record[compKey]) {
        components.push(record[compKey]);
      }
    }

    // Convert JIRA date format (DD/MMM/YY HH:MM AM/PM) to ISO 8601
    const isoTimestamp = convertJiraDateToISO(timestamp);

    const event = {
      timestamp: isoTimestamp,
      type: 'work_ticket_completed',
      title: `Completed ${record['Issue key']}: ${record['Summary']}`,
      namespace: 'quantified',
      metadata: {
        ticket_key: record['Issue key'],
        ticket_id: record['Issue id'],
        summary: record['Summary'],
        project: record['Project key'],
        project_name: record['Project name'],
        status: status,
        priority: record['Priority'],
        resolution: resolution,
        assignee: record['Assignee'],
        issue_type: record['Issue Type'],
        labels: labels.filter(Boolean),
        components: components.filter(Boolean),
        created: record['Created'],
        url: `https://your-instance.atlassian.net/browse/${record['Issue key']}` // Update with your JIRA URL
      }
    };

    events.push(event);
  }

  console.log(`✅ Created ${events.length} events`);
  console.log(`⏭️  Skipped ${skipped} tickets (not completed or no timestamp)`);

  return events;
}

/**
 * Convert JIRA date format to ISO 8601
 * Input: "14/May/24 12:45 PM"
 * Output: "2024-05-14T12:45:00.000Z"
 */
function convertJiraDateToISO(jiraDate) {
  if (!jiraDate) return new Date().toISOString();

  // Parse: DD/MMM/YY HH:MM AM/PM
  const dateRegex = /(\d+)\/(\w+)\/(\d+)\s+(\d+):(\d+)\s+(AM|PM)/;
  const match = jiraDate.match(dateRegex);

  if (!match) {
    console.warn(`⚠️  Could not parse date: ${jiraDate}`);
    return new Date().toISOString();
  }

  const [, day, monthStr, year, hour, minute, ampm] = match;

  const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };

  const month = monthMap[monthStr];
  const fullYear = `20${year}`; // Assumes 20xx century

  let hour24 = parseInt(hour);
  if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
  if (ampm === 'AM' && hour24 === 12) hour24 = 0;

  // ISO format: YYYY-MM-DDTHH:MM:SS.SSSZ
  const isoDate = `${fullYear}-${month}-${day.padStart(2, '0')}T${hour24.toString().padStart(2, '0')}:${minute}:00.000Z`;
  return isoDate;
}

/**
 * Store events in chronicle via HTTP API (with parallelization)
 */
async function storeEvents(events) {
  console.log(`\n📤 Uploading ${events.length} events to chronicle...`);
  console.log(`⚡ Using ${CONCURRENCY} concurrent requests\n`);

  let uploaded = 0;
  let failed = 0;
  const errors = [];

  // Process events in parallel chunks
  for (let i = 0; i < events.length; i += CONCURRENCY) {
    const chunk = events.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(events.length / CONCURRENCY);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${chunk.length} events in parallel)`);

    // Use Promise.allSettled to handle all requests in parallel
    const results = await Promise.allSettled(
      chunk.map(event =>
        fetch(CHRONICLE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'store_timeline_event',
            arguments: event
          })
        }).then(async (response) => {
          if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
          }
          return { success: true, ticket: event.metadata.ticket_key };
        })
      )
    );

    // Process results
    results.forEach((result, idx) => {
      const event = chunk[idx];
      if (result.status === 'fulfilled') {
        uploaded++;
        process.stdout.write('✓');
      } else {
        failed++;
        errors.push({
          ticket: event.metadata.ticket_key,
          timestamp: event.timestamp,
          error: result.reason.message,
          raw: event
        });
        process.stdout.write('✗');
      }
    });

    process.stdout.write('\n');

    // Small delay between batches
    if (i + CONCURRENCY < events.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`\n✅ Upload complete!`);
  console.log(`   Uploaded: ${uploaded}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${events.length}`);
  console.log(`   Success rate: ${((uploaded / events.length) * 100).toFixed(1)}%`);

  // Write errors to file if any
  if (errors.length > 0) {
    const errorFile = 'import-errors.json';
    fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2));
    console.log(`\n📝 Wrote ${errors.length} errors to ${errorFile}`);
    console.log(`   Retry with: node scripts/retry-failed-imports.js ${errorFile}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('❌ Usage: node import-jira-history.js <path-to-csv>');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log('🚀 JIRA History Import\n');
  console.log(`📁 CSV file: ${csvPath}\n`);

  // Parse CSV
  const events = parseJiraCSV(csvPath);

  if (events.length === 0) {
    console.log('⚠️  No events to import');
    process.exit(0);
  }

  // Confirm before uploading (skip if --yes flag provided)
  const skipConfirm = process.argv.includes('--yes');
  if (!skipConfirm) {
    console.log(`\n⚠️  About to upload ${events.length} events to chronicle`);
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Store in chronicle
  await storeEvents(events);

  console.log('\n✨ Done!');
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
