#!/usr/bin/env python3
"""
Retry failed Confluence imports - with longer delays to avoid rate limits
Run from: cd projects/graphiti/mcp_server && uv run python ../../../scripts/retry-failed-imports.py
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

    from graphiti_core import Graphiti
    from graphiti_core.llm_client import OpenAIClient
    from graphiti_core.llm_client.config import LLMConfig
    from graphiti_core.embedder import OpenAIEmbedder
    from graphiti_core.embedder.openai import OpenAIEmbedderConfig
    from graphiti_core.driver.falkordb_driver import FalkorDriver
    from graphiti_core.nodes import EpisodeType

    print("=" * 60)
    print("Retry Failed Confluence Imports")
    print("=" * 60)

    # Load failed pages from results
    results_file = Path('../../../data/confluence-export/import-results.json')
    results = json.loads(results_file.read_text())
    failed_titles = {e['title'] for e in results['errors']}
    print(f"Found {len(failed_titles)} failed pages to retry")

    # Load original export
    export_file = Path('../../../data/confluence-export/oc-space-graphiti-2025-11-25.json')
    all_pages = json.loads(export_file.read_text())
    
    # Match failed pages
    pages_to_retry = []
    for page in all_pages:
        title = page.get('source_description', page['name']).replace('Confluence page: ', '')[:40]
        if title in failed_titles:
            pages_to_retry.append(page)
    
    print(f"Matched {len(pages_to_retry)} pages from export")
    
    if not pages_to_retry:
        print("No pages to retry!")
        return

    # Initialize Graphiti
    driver = FalkorDriver(host='localhost', port=6379, database='confluence-oc')
    llm_config = LLMConfig(api_key=openai_key, model='gpt-4o-mini', small_model='gpt-4o-mini', temperature=0, max_tokens=4096)
    llm_client = OpenAIClient(config=llm_config, reasoning=None, verbosity=None)
    embedder_config = OpenAIEmbedderConfig(api_key=openai_key, embedding_model='text-embedding-3-small')
    embedder = OpenAIEmbedder(config=embedder_config)
    graphiti = Graphiti(graph_driver=driver, llm_client=llm_client, embedder=embedder)

    print("Building indices...")
    await graphiti.build_indices_and_constraints()

    success = 0
    errors = []
    total_entities = 0
    total_edges = 0

    print("-" * 60)

    for i, page in enumerate(pages_to_retry):
        progress = f"[{i+1}/{len(pages_to_retry)}]"
        title = page.get('source_description', page['name']).replace('Confluence page: ', '')[:40]

        try:
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

            # LONGER delay to avoid rate limits - 2 seconds between pages
            await asyncio.sleep(2)

        except Exception as e:
            error_msg = str(e)[:60]
            print(f"{progress} ERR: {title} - {error_msg}")
            errors.append({'title': title, 'error': str(e)})

    print("=" * 60)
    print(f"RETRY COMPLETE: {success}/{len(pages_to_retry)} pages")
    print(f"New entities: {total_entities}, New edges: {total_edges}")
    print(f"Still failed: {len(errors)}")
    
    # Save retry results
    retry_results = {
        'success': success,
        'total': len(pages_to_retry),
        'entities': total_entities,
        'edges': total_edges,
        'errors': errors
    }
    retry_file = Path('../../../data/confluence-export/retry-results.json')
    retry_file.write_text(json.dumps(retry_results, indent=2))
    print(f"Results saved to {retry_file}")

if __name__ == '__main__':
    asyncio.run(main())
