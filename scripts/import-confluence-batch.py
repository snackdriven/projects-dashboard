#!/usr/bin/env python3
"""
Batch import Confluence pages to Graphiti - TESTED AND WORKING
Run from: cd projects/graphiti/mcp_server && uv run python ../../../scripts/import-confluence-batch.py
"""

import asyncio
import os
import json
import sys
from pathlib import Path
from datetime import datetime, timezone

async def main():
    # Load environment
    for env_file in [Path('.env'), Path('../../../.env')]:
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if '=' in line and not line.startswith('#'):
                    key, _, value = line.partition('=')
                    key = key.strip()
                    value = value.strip().strip('"\'')
                    if key and not os.environ.get(key):
                        os.environ[key] = value

    openai_key = os.environ.get('OPENAI_API_KEY')
    if not openai_key:
        print("ERROR: OPENAI_API_KEY not found")
        sys.exit(1)

    # Initialize components
    from graphiti_core import Graphiti
    from graphiti_core.llm_client import OpenAIClient
    from graphiti_core.llm_client.config import LLMConfig
    from graphiti_core.embedder import OpenAIEmbedder
    from graphiti_core.embedder.openai import OpenAIEmbedderConfig
    from graphiti_core.driver.falkordb_driver import FalkorDriver
    from graphiti_core.nodes import EpisodeType

    print("=" * 60)
    print("Confluence to Graphiti Import")
    print("=" * 60)

    driver = FalkorDriver(host='localhost', port=6379, database='confluence-oc')
    llm_config = LLMConfig(api_key=openai_key, model='gpt-4o-mini', small_model='gpt-4o-mini', temperature=0, max_tokens=4096)
    llm_client = OpenAIClient(config=llm_config, reasoning=None, verbosity=None)
    embedder_config = OpenAIEmbedderConfig(api_key=openai_key, embedding_model='text-embedding-3-small')
    embedder = OpenAIEmbedder(config=embedder_config)
    graphiti = Graphiti(graph_driver=driver, llm_client=llm_client, embedder=embedder)

    print("Building indices...")
    await graphiti.build_indices_and_constraints()

    # Load pages
    export_file = Path('../../../data/confluence-export/oc-space-graphiti-2025-11-25.json')
    pages = json.loads(export_file.read_text())
    print(f"Loaded {len(pages)} pages")

    # Track progress
    success = 0
    errors = []
    total_entities = 0
    total_edges = 0
    start_time = datetime.now()

    print("-" * 60)

    for i, page in enumerate(pages):
        progress = f"[{i+1}/{len(pages)}]"
        title = page.get('source_description', page['name']).replace('Confluence page: ', '')[:40]

        try:
            # Limit content to manage costs
            content = page['content'][:6000] if len(page['content']) > 6000 else page['content']

            result = await graphiti.add_episode(
                name=page['name'],
                episode_body=content,
                source=EpisodeType.text,
                source_description=page.get('source_description', ''),
                reference_time=datetime.now(timezone.utc),
                group_id='confluence-oc'
            )

            entities = len(result.nodes)
            edges = len(result.edges)
            total_entities += entities
            total_edges += edges
            success += 1

            print(f"{progress} OK: {title} ({entities}e/{edges}r)")

            # Small delay to avoid rate limits
            await asyncio.sleep(0.5)

        except Exception as e:
            error_msg = str(e)[:60]
            print(f"{progress} ERR: {title} - {error_msg}")
            errors.append({'title': title, 'error': str(e)})

            if 'rate' in str(e).lower() or '429' in str(e):
                print("Rate limit - waiting 30s...")
                await asyncio.sleep(30)
            else:
                await asyncio.sleep(1)

    # Summary
    elapsed = (datetime.now() - start_time).total_seconds()
    print("\n" + "=" * 60)
    print("IMPORT COMPLETE")
    print("=" * 60)
    print(f"Pages: {success}/{len(pages)} imported")
    print(f"Entities: {total_entities}")
    print(f"Relationships: {total_edges}")
    print(f"Errors: {len(errors)}")
    print(f"Time: {elapsed:.1f}s ({elapsed/len(pages):.1f}s/page)")

    if errors:
        print("\nFirst 5 errors:")
        for e in errors[:5]:
            print(f"  - {e['title']}")

    await graphiti.close()

    # Save results
    results_file = Path('../../../data/confluence-export/import-results.json')
    results_file.write_text(json.dumps({
        'success': success,
        'total': len(pages),
        'entities': total_entities,
        'edges': total_edges,
        'errors': errors,
        'elapsed_seconds': elapsed
    }, indent=2))
    print(f"\nResults saved to: {results_file}")

if __name__ == "__main__":
    asyncio.run(main())
