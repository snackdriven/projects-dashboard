/**
 * JIRA Timeline Query Tool
 *
 * Comprehensive query and analysis tool for JIRA timeline events in chronicle.
 * Provides multiple analysis modes: statistics, search, timeline patterns, and filters.
 *
 * Usage:
 *   node scripts/query-jira.js stats              # Show statistics
 *   node scripts/query-jira.js search "BHP-123"   # Search by ticket key
 *   node scripts/query-jira.js date 2024-01-01 2024-12-31  # Date range query
 *   node scripts/query-jira.js timeline monthly   # Timeline patterns
 *   node scripts/query-jira.js project BHP        # Filter by project
 *   node scripts/query-jira.js assignee "John"    # Filter by assignee
 */

const CHRONICLE_API = 'http://localhost:3001/api/mcp/chronicle';

/**
 * Fetch all work tickets from chronicle
 */
async function getAllWorkTickets() {
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

/**
 * Display comprehensive statistics
 */
function displayStatistics(events) {
  console.log('📊 JIRA TIMELINE STATISTICS\n');
  console.log(`Total tickets: ${events.length}\n`);

  // By Project
  const byProject = new Map();
  events.forEach(e => {
    const proj = e.metadata.project || 'Unknown';
    byProject.set(proj, (byProject.get(proj) || 0) + 1);
  });

  console.log('📁 BY PROJECT:');
  Array.from(byProject.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([proj, count]) => {
      const bar = '█'.repeat(Math.ceil(count / 10));
      console.log(`   ${proj.padEnd(10)} ${count.toString().padStart(4)} ${bar}`);
    });

  // By Assignee
  const byAssignee = new Map();
  events.forEach(e => {
    const assignee = e.metadata.assignee || 'Unassigned';
    byAssignee.set(assignee, (byAssignee.get(assignee) || 0) + 1);
  });

  console.log('\n👤 BY ASSIGNEE (Top 10):');
  Array.from(byAssignee.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([assignee, count]) => {
      const bar = '█'.repeat(Math.ceil(count / 10));
      console.log(`   ${assignee.padEnd(25)} ${count.toString().padStart(4)} ${bar}`);
    });

  // By Status
  const byStatus = new Map();
  events.forEach(e => {
    const status = e.metadata.status || 'Unknown';
    byStatus.set(status, (byStatus.get(status) || 0) + 1);
  });

  console.log('\n📌 BY STATUS:');
  Array.from(byStatus.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const bar = '█'.repeat(Math.ceil(count / 5));
      console.log(`   ${status.padEnd(15)} ${count.toString().padStart(4)} ${bar}`);
    });

  // By Priority
  const byPriority = new Map();
  events.forEach(e => {
    const priority = e.metadata.priority || 'Unknown';
    byPriority.set(priority, (byPriority.get(priority) || 0) + 1);
  });

  console.log('\n⚡ BY PRIORITY:');
  Array.from(byPriority.entries())
    .sort((a, b) => {
      const priorityOrder = { 'Highest': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'Lowest': 1 };
      return (priorityOrder[b[0]] || 0) - (priorityOrder[a[0]] || 0);
    })
    .forEach(([priority, count]) => {
      const bar = '█'.repeat(Math.ceil(count / 10));
      console.log(`   ${priority.padEnd(15)} ${count.toString().padStart(4)} ${bar}`);
    });

  // By Issue Type
  const byIssueType = new Map();
  events.forEach(e => {
    const issueType = e.metadata.issue_type || 'Unknown';
    byIssueType.set(issueType, (byIssueType.get(issueType) || 0) + 1);
  });

  console.log('\n🎫 BY ISSUE TYPE:');
  Array.from(byIssueType.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const bar = '█'.repeat(Math.ceil(count / 10));
      console.log(`   ${type.padEnd(15)} ${count.toString().padStart(4)} ${bar}`);
    });

  // Top Labels
  const labelCounts = new Map();
  events.forEach(e => {
    (e.metadata.labels || []).forEach(label => {
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    });
  });

  if (labelCounts.size > 0) {
    console.log('\n🏷️  TOP LABELS:');
    Array.from(labelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([label, count]) => {
        console.log(`   ${label.padEnd(25)} ${count.toString().padStart(4)}`);
      });
  }

  // Date Range
  const timestamps = events.map(e => new Date(e.timestamp));
  const earliest = new Date(Math.min(...timestamps));
  const latest = new Date(Math.max(...timestamps));

  console.log('\n📅 DATE RANGE:');
  console.log(`   Earliest: ${earliest.toISOString().split('T')[0]}`);
  console.log(`   Latest:   ${latest.toISOString().split('T')[0]}`);
  console.log(`   Span:     ${Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24))} days`);
}

/**
 * Search tickets by key or summary
 */
function searchTickets(events, query) {
  const lowerQuery = query.toLowerCase();
  const matches = events.filter(e =>
    e.metadata.ticket_key.toLowerCase().includes(lowerQuery) ||
    e.metadata.summary.toLowerCase().includes(lowerQuery)
  );

  console.log(`🔍 SEARCH RESULTS FOR: "${query}"\n`);
  console.log(`Found ${matches.length} matches\n`);

  if (matches.length === 0) {
    console.log('No tickets found matching your query.');
    return;
  }

  matches.forEach(e => {
    const date = new Date(e.timestamp).toISOString().split('T')[0];
    console.log(`${e.metadata.ticket_key} | ${date} | ${e.metadata.status}`);
    console.log(`  ${e.metadata.summary}`);
    console.log(`  Project: ${e.metadata.project} | Assignee: ${e.metadata.assignee || 'Unassigned'}`);
    if (e.metadata.labels && e.metadata.labels.length > 0) {
      console.log(`  Labels: ${e.metadata.labels.join(', ')}`);
    }
    console.log();
  });
}

/**
 * Query by date range
 */
function queryByDateRange(events, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const filtered = events.filter(e => {
    const date = new Date(e.timestamp);
    return date >= start && date <= end;
  });

  console.log(`📅 TICKETS FROM ${startDate} TO ${endDate}\n`);
  console.log(`Found ${filtered.length} tickets\n`);

  if (filtered.length === 0) {
    console.log('No tickets found in this date range.');
    return;
  }

  // Group by month
  const byMonth = new Map();
  filtered.forEach(e => {
    const date = new Date(e.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1);
  });

  console.log('BY MONTH:');
  Array.from(byMonth.entries())
    .sort()
    .forEach(([month, count]) => {
      const bar = '█'.repeat(Math.ceil(count / 5));
      console.log(`   ${month}  ${count.toString().padStart(4)} ${bar}`);
    });

  console.log('\nRECENT TICKETS (Last 10):');
  filtered
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10)
    .forEach(e => {
      const date = new Date(e.timestamp).toISOString().split('T')[0];
      console.log(`   ${date} | ${e.metadata.ticket_key.padEnd(12)} | ${e.metadata.summary.substring(0, 60)}`);
    });
}

/**
 * Timeline patterns analysis
 */
function analyzeTimeline(events, granularity = 'monthly') {
  console.log(`📈 TIMELINE ANALYSIS (${granularity.toUpperCase()})\n`);

  const grouped = new Map();

  events.forEach(e => {
    const date = new Date(e.timestamp);
    let key;

    switch (granularity) {
      case 'daily':
        key = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    grouped.set(key, (grouped.get(key) || 0) + 1);
  });

  // Calculate statistics
  const counts = Array.from(grouped.values());
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const max = Math.max(...counts);
  const min = Math.min(...counts);

  console.log('STATISTICS:');
  console.log(`   Average: ${avg.toFixed(1)} tickets per ${granularity.slice(0, -2)}`);
  console.log(`   Max:     ${max} tickets`);
  console.log(`   Min:     ${min} tickets`);
  console.log(`   Periods: ${grouped.size}\n`);

  console.log('TIMELINE:');
  Array.from(grouped.entries())
    .sort()
    .forEach(([period, count]) => {
      const bar = '█'.repeat(Math.ceil((count / max) * 50));
      console.log(`   ${period.padEnd(12)} ${count.toString().padStart(4)} ${bar}`);
    });

  // Identify trends
  const sortedEntries = Array.from(grouped.entries()).sort();
  if (sortedEntries.length >= 3) {
    const recentAvg = sortedEntries.slice(-3).reduce((sum, [, count]) => sum + count, 0) / 3;
    const olderAvg = sortedEntries.slice(0, 3).reduce((sum, [, count]) => sum + count, 0) / 3;
    const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

    console.log('\nTREND:');
    if (trend > 10) {
      console.log(`   📈 Increasing (${trend.toFixed(1)}% higher than earlier periods)`);
    } else if (trend < -10) {
      console.log(`   📉 Decreasing (${Math.abs(trend).toFixed(1)}% lower than earlier periods)`);
    } else {
      console.log(`   ➡️  Stable (within 10% of earlier periods)`);
    }
  }
}

/**
 * Filter by project
 */
function filterByProject(events, project) {
  const filtered = events.filter(e =>
    e.metadata.project && e.metadata.project.toLowerCase().includes(project.toLowerCase())
  );

  console.log(`📁 TICKETS FOR PROJECT: ${project}\n`);
  console.log(`Found ${filtered.length} tickets\n`);

  if (filtered.length === 0) {
    console.log('No tickets found for this project.');
    return;
  }

  displayStatistics(filtered);
}

/**
 * Filter by assignee
 */
function filterByAssignee(events, assignee) {
  const filtered = events.filter(e =>
    e.metadata.assignee && e.metadata.assignee.toLowerCase().includes(assignee.toLowerCase())
  );

  console.log(`👤 TICKETS FOR ASSIGNEE: ${assignee}\n`);
  console.log(`Found ${filtered.length} tickets\n`);

  if (filtered.length === 0) {
    console.log('No tickets found for this assignee.');
    return;
  }

  displayStatistics(filtered);
}

/**
 * Display help
 */
function displayHelp() {
  console.log('📖 JIRA TIMELINE QUERY TOOL\n');
  console.log('USAGE:');
  console.log('  node scripts/query-jira.js <command> [arguments]\n');
  console.log('COMMANDS:');
  console.log('  stats                           Show comprehensive statistics');
  console.log('  search <query>                  Search by ticket key or summary');
  console.log('  date <start> <end>              Query by date range (YYYY-MM-DD)');
  console.log('  timeline <daily|weekly|monthly> Analyze timeline patterns');
  console.log('  project <name>                  Filter by project');
  console.log('  assignee <name>                 Filter by assignee');
  console.log('  help                            Show this help message\n');
  console.log('EXAMPLES:');
  console.log('  node scripts/query-jira.js stats');
  console.log('  node scripts/query-jira.js search "BHP-123"');
  console.log('  node scripts/query-jira.js search "authentication"');
  console.log('  node scripts/query-jira.js date 2024-01-01 2024-12-31');
  console.log('  node scripts/query-jira.js timeline monthly');
  console.log('  node scripts/query-jira.js timeline weekly');
  console.log('  node scripts/query-jira.js project BHP');
  console.log('  node scripts/query-jira.js assignee "John Smith"');
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];

  if (!command || command === 'help') {
    displayHelp();
    return;
  }

  console.log('🔍 Fetching JIRA timeline events from chronicle...\n');
  const events = await getAllWorkTickets();

  if (events.length === 0) {
    console.log('⚠️  No JIRA events found in chronicle.');
    console.log('   Run the import script first: node scripts/import-jira-history.js <csv-file>');
    return;
  }

  switch (command) {
    case 'stats':
      displayStatistics(events);
      break;

    case 'search':
      const query = process.argv[3];
      if (!query) {
        console.error('❌ Usage: node scripts/query-jira.js search <query>');
        process.exit(1);
      }
      searchTickets(events, query);
      break;

    case 'date':
      const startDate = process.argv[3];
      const endDate = process.argv[4];
      if (!startDate || !endDate) {
        console.error('❌ Usage: node scripts/query-jira.js date <start-date> <end-date>');
        console.error('   Example: node scripts/query-jira.js date 2024-01-01 2024-12-31');
        process.exit(1);
      }
      queryByDateRange(events, startDate, endDate);
      break;

    case 'timeline':
      const granularity = process.argv[3] || 'monthly';
      if (!['daily', 'weekly', 'monthly'].includes(granularity)) {
        console.error('❌ Invalid granularity. Use: daily, weekly, or monthly');
        process.exit(1);
      }
      analyzeTimeline(events, granularity);
      break;

    case 'project':
      const project = process.argv[3];
      if (!project) {
        console.error('❌ Usage: node scripts/query-jira.js project <project-name>');
        process.exit(1);
      }
      filterByProject(events, project);
      break;

    case 'assignee':
      const assignee = process.argv[3];
      if (!assignee) {
        console.error('❌ Usage: node scripts/query-jira.js assignee <assignee-name>');
        process.exit(1);
      }
      filterByAssignee(events, assignee);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('   Run "node scripts/query-jira.js help" for usage information.');
      process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
