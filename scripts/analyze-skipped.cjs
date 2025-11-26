const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvContent = fs.readFileSync('/mnt/c/Users/bette/Downloads/Jira (2).csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_quotes: true,
  relax_column_count: true
});

console.log('Total tickets in CSV:', records.length);

const skipped = [];
for (const record of records) {
  const status = record['Status'];
  const resolution = record['Resolution'];
  const resolved = record['Resolved'];

  // Skip if no resolved date or status
  if (!resolved || !status || status === '') {
    skipped.push({
      key: record['Issue key'],
      status: status || 'No status',
      resolution: resolution || 'None',
      reason: 'No resolved date or status'
    });
    continue;
  }

  // Check if done
  const isDone = status === 'Done' ||
                 status === 'Closed' ||
                 status === 'Resolved' ||
                 resolution === 'Done' ||
                 resolution === 'Fixed' ||
                 resolution === 'Completed';

  if (!isDone) {
    skipped.push({
      key: record['Issue key'],
      status: status,
      resolution: resolution || 'None',
      reason: 'Not completed'
    });
  }
}

console.log('\nSkipped tickets:', skipped.length);

// Group by status
const byStatus = {};
skipped.forEach(t => {
  byStatus[t.status] = (byStatus[t.status] || 0) + 1;
});

console.log('\nBreakdown by status:');
Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`);
});

// Show some examples
console.log('\nExample skipped tickets:');
skipped.slice(0, 10).forEach(t => {
  console.log(`  ${t.key}: ${t.status} (Resolution: ${t.resolution})`);
});
