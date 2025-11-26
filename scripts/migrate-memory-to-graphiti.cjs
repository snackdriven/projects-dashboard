#!/usr/bin/env node
/**
 * Migration script: Memory MCP -> Graphiti
 *
 * Reads entities from the memory MCP JSON file and ingests them into Graphiti
 * via the add_memory API endpoint.
 *
 * Usage: node migrate-memory-to-graphiti.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MEMORY_FILE = '/home/kg/.npm/_npx/15b07286cbcc3329/node_modules/@modelcontextprotocol/server-memory/dist/memory.json';
const GRAPHITI_URL = 'http://localhost:8000/mcp/';

// Rate limiting to avoid overwhelming the API
const DELAY_MS = 2000; // 2 seconds between requests (entity extraction is slow)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGraphitiMCP(method, params) {
  const response = await fetch(GRAPHITI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: Date.now(),
    }),
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function formatEntityAsText(entity) {
  // Convert entity to natural text that Graphiti can process
  const lines = [];
  lines.push(`Entity: ${entity.name}`);
  lines.push(`Type: ${entity.entityType}`);
  if (entity.observations && entity.observations.length > 0) {
    lines.push('Observations:');
    entity.observations.forEach(obs => {
      lines.push(`- ${obs}`);
    });
  }
  return lines.join('\n');
}

async function migrateEntity(entity, dryRun = false) {
  const text = formatEntityAsText(entity);

  if (dryRun) {
    console.log(`[DRY RUN] Would migrate: ${entity.name} (${entity.entityType})`);
    console.log(`  Text length: ${text.length} chars`);
    return { success: true, dryRun: true };
  }

  try {
    // Use the add_memory tool
    const result = await callGraphitiMCP('tools/call', {
      name: 'add_memory',
      arguments: {
        content: text,
      },
    });

    console.log(`Migrated: ${entity.name} (${entity.entityType})`);
    return { success: true, result };
  } catch (error) {
    console.error(`Failed: ${entity.name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('Memory MCP -> Graphiti Migration');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  console.log(`Source: ${MEMORY_FILE}`);
  console.log(`Target: ${GRAPHITI_URL}`);
  console.log('='.repeat(60));

  // Check if memory file exists
  if (!fs.existsSync(MEMORY_FILE)) {
    console.error(`Memory file not found: ${MEMORY_FILE}`);
    process.exit(1);
  }

  // Check if Graphiti is running
  if (!dryRun) {
    try {
      const healthCheck = await callGraphitiMCP('tools/list', {});
      if (healthCheck.error) {
        console.error('Graphiti MCP not responding correctly');
        console.error(healthCheck);
        process.exit(1);
      }
      console.log('Graphiti MCP is running');
    } catch (error) {
      console.error(`Cannot connect to Graphiti: ${error.message}`);
      process.exit(1);
    }
  }

  // Read and parse entities (NDJSON format)
  const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());

  const entities = [];
  const relations = [];

  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      if (item.type === 'entity') {
        entities.push(item);
      } else if (item.type === 'relation') {
        relations.push(item);
      }
    } catch (e) {
      console.warn(`Skipping malformed line: ${line.substring(0, 50)}...`);
    }
  }

  console.log(`Found ${entities.length} entities and ${relations.length} relations`);
  console.log('');

  // Categorize entities
  const byType = {};
  entities.forEach(e => {
    byType[e.entityType] = (byType[e.entityType] || 0) + 1;
  });
  console.log('Entities by type:');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('');

  // Ask for confirmation
  if (!dryRun) {
    console.log('Starting migration in 5 seconds... (Ctrl+C to cancel)');
    await sleep(5000);
  }

  // Migrate entities
  let success = 0;
  let failed = 0;

  // Prioritize non-JIRA entities first (more interesting for the knowledge graph)
  const prioritized = entities.sort((a, b) => {
    const aIsJira = a.entityType === 'JiraTicket' || a.entityType === 'Jira Ticket';
    const bIsJira = b.entityType === 'JiraTicket' || b.entityType === 'Jira Ticket';
    if (aIsJira && !bIsJira) return 1;
    if (!aIsJira && bIsJira) return -1;
    return 0;
  });

  for (let i = 0; i < prioritized.length; i++) {
    const entity = prioritized[i];
    console.log(`[${i + 1}/${prioritized.length}] Processing ${entity.name}...`);

    const result = await migrateEntity(entity, dryRun);
    if (result.success) {
      success++;
    } else {
      failed++;
    }

    // Rate limiting
    if (!dryRun && i < prioritized.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Migration Complete');
  console.log(`  Successful: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log('='.repeat(60));

  // Note about relations
  if (relations.length > 0) {
    console.log('');
    console.log('Note: Relations were not migrated.');
    console.log('Graphiti will infer relationships during entity extraction.');
  }
}

main().catch(console.error);
