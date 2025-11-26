#!/usr/bin/env python3
"""
Migration script: Memory MCP -> Graphiti (Parallel Version)

Reads entities from the memory MCP JSON file and ingests them into Graphiti
using the graphiti-core library directly with parallel processing.

Run from the graphiti/mcp_server directory:
  cd projects/graphiti/mcp_server
  uv run python ../../../scripts/migrate-memory-to-graphiti.py
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

MEMORY_FILE = Path.home() / ".npm/_npx/15b07286cbcc3329/node_modules/@modelcontextprotocol/server-memory/dist/memory.json"
CONCURRENCY = 2  # Reduced to avoid rate limits
BATCH_DELAY = 2  # Delay between batches (seconds)


def format_entity_as_text(entity: dict) -> str:
    """Convert entity to natural text for Graphiti ingestion."""
    lines = []
    lines.append(f"Entity: {entity['name']}")
    lines.append(f"Type: {entity['entityType']}")
    if entity.get('observations'):
        lines.append('Observations:')
        for obs in entity['observations']:
            lines.append(f"- {obs}")
    return '\n'.join(lines)


# Global counters for progress tracking
success_count = 0
failed_count = 0
total_count = 0
lock = asyncio.Lock()


async def migrate_entity(graphiti, entity, index, semaphore):
    """Migrate a single entity with semaphore-controlled concurrency."""
    global success_count, failed_count

    async with semaphore:
        name = entity.get('name', 'Unknown')
        etype = entity.get('entityType', 'Unknown')

        try:
            text = format_entity_as_text(entity)

            # Add as episode
            await graphiti.add_episode(
                name=f"Memory import: {name}",
                episode_body=text,
                source_description="Migrated from Memory MCP",
                reference_time=datetime.now()
            )

            async with lock:
                success_count += 1
                print(f"[{success_count + failed_count}/{total_count}] {name} ({etype})... OK")
            return True
        except Exception as e:
            async with lock:
                failed_count += 1
                print(f"[{success_count + failed_count}/{total_count}] {name} ({etype})... FAILED: {e}")
            return False


async def main():
    global total_count

    # Import graphiti-core components
    from graphiti_core import Graphiti
    from graphiti_core.llm_client.anthropic_client import AnthropicClient
    from graphiti_core.llm_client.config import LLMConfig
    from graphiti_core.embedder.openai import OpenAIEmbedder, OpenAIEmbedderConfig
    from graphiti_core.driver.falkordb_driver import FalkorDriver

    print("=" * 60)
    print("Memory MCP -> Graphiti Migration (PARALLEL)")
    print(f"Model: Claude 3.5 Haiku (12x cheaper than Sonnet)")
    print(f"Concurrency: {CONCURRENCY} simultaneous tasks")
    print("=" * 60)
    print(f"Source: {MEMORY_FILE}")
    print("=" * 60)

    # Check memory file
    if not MEMORY_FILE.exists():
        print(f"ERROR: Memory file not found: {MEMORY_FILE}")
        sys.exit(1)

    # Load environment from the mcp_server .env
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / "projects" / "graphiti" / "mcp_server" / ".env"
    load_dotenv(env_path)

    anthropic_key = os.getenv('ANTHROPIC_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')

    if not anthropic_key or not openai_key:
        print("ERROR: Missing API keys. Set ANTHROPIC_API_KEY and OPENAI_API_KEY")
        sys.exit(1)

    # Initialize Graphiti
    print("Initializing Graphiti client (using Anthropic)...")

    # Create LLM client with config (Anthropic Haiku - 12x cheaper)
    llm_config = LLMConfig(
        api_key=anthropic_key,
        model="claude-3-5-haiku-latest",
    )
    llm_client = AnthropicClient(config=llm_config)

    # Create embedder with config (OpenAI for embeddings)
    embedder_config = OpenAIEmbedderConfig(
        api_key=openai_key,
        embedding_model="text-embedding-3-small",
    )
    embedder = OpenAIEmbedder(config=embedder_config)

    # Create FalkorDB driver
    falkor_driver = FalkorDriver(
        host="localhost",
        port=6379,
    )

    graphiti = Graphiti(
        graph_driver=falkor_driver,
        llm_client=llm_client,
        embedder=embedder,
    )

    await graphiti.build_indices_and_constraints()
    print("Graphiti initialized successfully")

    # Read entities
    content = MEMORY_FILE.read_text()
    lines = [l for l in content.strip().split('\n') if l.strip()]

    entities = []
    relations = []

    for line in lines:
        try:
            item = json.loads(line)
            if item.get('type') == 'entity':
                entities.append(item)
            elif item.get('type') == 'relation':
                relations.append(item)
        except json.JSONDecodeError:
            print(f"Skipping malformed line: {line[:50]}...")

    print(f"\nFound {len(entities)} entities and {len(relations)} relations")

    # Categorize
    by_type = {}
    for e in entities:
        t = e.get('entityType', 'unknown')
        by_type[t] = by_type.get(t, 0) + 1

    print("\nEntities by type:")
    for t, count in sorted(by_type.items(), key=lambda x: -x[1])[:10]:
        print(f"  {t}: {count}")
    print()

    # Prioritize non-JIRA first
    jira_types = {'JiraTicket', 'jira-ticket', 'Jira Ticket', 'JIRA Ticket'}
    prioritized = sorted(entities, key=lambda e: e.get('entityType', '') in jira_types)
    total_count = len(prioritized)

    # Calculate time estimate
    time_per_entity = 30  # Estimated seconds per entity with parallelization
    estimated_time = (total_count / CONCURRENCY) * time_per_entity / 60
    print(f"Estimated time: ~{estimated_time:.0f} minutes with {CONCURRENCY}x parallelization")
    print("\nStarting migration in 3 seconds...")
    await asyncio.sleep(3)

    # Create semaphore for rate limiting
    semaphore = asyncio.Semaphore(CONCURRENCY)

    # Create all migration tasks
    start_time = datetime.now()
    tasks = [
        migrate_entity(graphiti, entity, i, semaphore)
        for i, entity in enumerate(prioritized)
    ]

    # Run all tasks concurrently (semaphore limits actual concurrency)
    await asyncio.gather(*tasks)

    elapsed = (datetime.now() - start_time).total_seconds()

    print()
    print("=" * 60)
    print("Migration Complete")
    print(f"  Successful: {success_count}")
    print(f"  Failed: {failed_count}")
    print(f"  Time: {elapsed/60:.1f} minutes")
    print(f"  Rate: {total_count / elapsed * 60:.1f} entities/minute")
    print("=" * 60)

    await graphiti.close()


if __name__ == "__main__":
    asyncio.run(main())
