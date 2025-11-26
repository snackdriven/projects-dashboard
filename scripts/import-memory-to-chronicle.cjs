#!/usr/bin/env node
/**
 * Import Memory MCP backup into Chronicle
 *
 * Converts memory MCP entities to chronicle memories with proper namespacing.
 * Relations are stored separately for graph reconstruction.
 */

const fs = require('fs');
const path = require('path');

const BACKUP_FILE = path.join(__dirname, '../data/memory-mcp-backup-20251125.json');
const CHRONICLE_OUTPUT = path.join(__dirname, '../data/chronicle-import.json');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

async function main() {
  console.log('Reading memory MCP backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim());

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
      console.warn('Skipping malformed line');
    }
  }

  console.log(`Found ${entities.length} entities and ${relations.length} relations`);

  // Convert to chronicle memory format
  const memories = [];

  // Store entities
  for (const entity of entities) {
    const key = `entity:${slugify(entity.name)}`;
    memories.push({
      key,
      namespace: 'memory-mcp',
      value: {
        name: entity.name,
        entityType: entity.entityType,
        observations: entity.observations || [],
        importedAt: new Date().toISOString(),
        source: 'memory-mcp'
      }
    });
  }

  // Store relations
  for (const relation of relations) {
    const key = `relation:${slugify(relation.from)}-${slugify(relation.relationType)}-${slugify(relation.to)}`;
    memories.push({
      key,
      namespace: 'memory-mcp',
      value: {
        from: relation.from,
        to: relation.to,
        relationType: relation.relationType,
        importedAt: new Date().toISOString(),
        source: 'memory-mcp'
      }
    });
  }

  // Store entity type index for easy querying
  const byType = {};
  for (const entity of entities) {
    const t = entity.entityType;
    if (!byType[t]) byType[t] = [];
    byType[t].push(entity.name);
  }

  memories.push({
    key: 'index:entity-types',
    namespace: 'memory-mcp',
    value: byType
  });

  // Write output for reference
  fs.writeFileSync(CHRONICLE_OUTPUT, JSON.stringify(memories, null, 2));
  console.log(`\nPrepared ${memories.length} memories for chronicle`);
  console.log(`Output written to: ${CHRONICLE_OUTPUT}`);

  // Output the memories array for piping to chronicle
  console.log('\n--- IMPORT SUMMARY ---');
  console.log(`Entities: ${entities.length}`);
  console.log(`Relations: ${relations.length}`);
  console.log(`Total memories: ${memories.length}`);
  console.log('\nEntity types:');
  Object.entries(byType).sort((a,b) => b[1].length - a[1].length).slice(0, 10).forEach(([type, names]) => {
    console.log(`  ${type}: ${names.length}`);
  });

  return memories;
}

main().catch(console.error);
