#!/usr/bin/env node
/**
 * Bulk import memories to chronicle via HTTP API
 *
 * Usage: node scripts/bulk-import-chronicle.cjs
 */

const fs = require('fs');
const path = require('path');

const CHRONICLE_FILE = path.join(__dirname, '../data/chronicle-import.json');
const BATCH_SIZE = 50;

async function main() {
  console.log('Reading chronicle import file...');
  const memories = JSON.parse(fs.readFileSync(CHRONICLE_FILE, 'utf-8'));
  console.log(`Total memories to import: ${memories.length}`);

  // Chronicle MCP server runs on port 3001 (check .mcp.json)
  // Actually, chronicle is an MCP server that connects via stdio
  // We need to output the batches for manual MCP import

  const batches = [];
  for (let i = 0; i < memories.length; i += BATCH_SIZE) {
    batches.push(memories.slice(i, i + BATCH_SIZE));
  }

  console.log(`Split into ${batches.length} batches of ${BATCH_SIZE}`);

  // Write each batch to a separate file
  for (let i = 0; i < batches.length; i++) {
    const batchFile = path.join(__dirname, `../data/batch-${i}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(batches[i]));
    console.log(`Wrote batch ${i}: ${batches[i].length} memories`);
  }

  console.log('\nBatches ready for import.');
  console.log('Use chronicle MCP bulk_store_memories with each batch file.');
}

main().catch(console.error);
