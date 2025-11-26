#!/usr/bin/env python3
"""
Import Confluence export to Graphiti using OpenAI for entity extraction.

Usage:
  cd projects/graphiti/mcp_server
  uv run python ../../../scripts/import-confluence-to-graphiti.py

Requires:
  - FalkorDB running (docker)
  - OPENAI_API_KEY in environment
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add graphiti mcp_server src to path for config imports
mcp_server_dir = Path(__file__).parent.parent / 'projects' / 'graphiti' / 'mcp_server'
sys.path.insert(0, str(mcp_server_dir / 'src'))

async def main():
    # Load environment from mcp_server .env (has OpenAI key)
    env_path = mcp_server_dir / '.env'
    if env_path.exists():
        print(f"Loading environment from {env_path}")
        for line in env_path.read_text().splitlines():
            if '=' in line and not line.startswith('#'):
                key, _, value = line.partition('=')
                key = key.strip()
                value = value.strip().strip('"\'')
                if key and not os.environ.get(key):
                    os.environ[key] = value

    # Also load root .env for fallback
    root_env = Path(__file__).parent.parent / '.env'
    if root_env.exists():
        for line in root_env.read_text().splitlines():
            if '=' in line and not line.startswith('#'):
                key, _, value = line.partition('=')
                key = key.strip()
                value = value.strip().strip('"\'')
                if key and not os.environ.get(key):
                    os.environ[key] = value

    # Check for OpenAI key
    openai_key = os.environ.get('OPENAI_API_KEY')
    if not openai_key:
        print("ERROR: OPENAI_API_KEY not found in environment")
        sys.exit(1)

    print(f"OpenAI API key found: {openai_key[:20]}...")

    # Import graphiti_core components
    try:
        from graphiti_core import Graphiti
        from graphiti_core.llm_client import OpenAIClient
        from graphiti_core.llm_client.config import LLMConfig
        from graphiti_core.embedder import OpenAIEmbedder
        from graphiti_core.embedder.openai import OpenAIEmbedderConfig
        from graphiti_core.nodes import EpisodeType
    except ImportError as e:
        print(f"ERROR: Cannot import graphiti_core: {e}")
        print("Run from: cd projects/graphiti/mcp_server && uv run python ../../../scripts/import-confluence-to-graphiti.py")
        sys.exit(1)

    # Try to import FalkorDB driver
    try:
        from graphiti_core.driver.falkordb_driver import FalkorDriver
        print("FalkorDB driver available")
    except ImportError as e:
        print(f"ERROR: Cannot import FalkorDriver: {e}")
        sys.exit(1)

    # Find latest Confluence export
    export_dir = Path(__file__).parent.parent / 'data' / 'confluence-export'
    graphiti_files = sorted(export_dir.glob('*-graphiti-*.json'), reverse=True)

    if not graphiti_files:
        print(f"ERROR: No Graphiti export files found in {export_dir}")
        sys.exit(1)

    export_file = graphiti_files[0]
    print(f"Loading: {export_file.name}")

    with open(export_file) as f:
        pages = json.load(f)

    print(f"Found {len(pages)} pages to import")

    # Initialize FalkorDB driver
    print("\nConnecting to FalkorDB...")
    falkor_uri = os.environ.get('FALKORDB_URI', 'redis://localhost:6379')

    # Parse URI - FalkorDriver expects host/port, not URI
    from urllib.parse import urlparse
    parsed = urlparse(falkor_uri)
    host = parsed.hostname or 'localhost'
    port = parsed.port or 6379

    driver = FalkorDriver(
        host=host,
        port=port,
        database='confluence-import'  # Use dedicated database
    )

    # Initialize LLM client with OpenAI
    # Note: gpt-4o-mini is NOT a reasoning model, so disable reasoning/verbosity parameters
    print("Initializing OpenAI LLM client (gpt-4o-mini)...")
    llm_config = LLMConfig(
        api_key=openai_key,
        model='gpt-4o-mini',
        small_model='gpt-4o-mini',
        temperature=0,
        max_tokens=4096,
    )
    # Pass reasoning=None, verbosity=None to disable reasoning parameters for non-reasoning models
    llm_client = OpenAIClient(config=llm_config, reasoning=None, verbosity=None)

    # Initialize embedder with OpenAI
    print("Initializing OpenAI embedder...")
    embedder_config = OpenAIEmbedderConfig(
        api_key=openai_key,
        embedding_model='text-embedding-3-small',
    )
    embedder = OpenAIEmbedder(config=embedder_config)

    # Create Graphiti instance (use graph_driver parameter per Context7 docs)
    print("Creating Graphiti instance...")
    graphiti = Graphiti(
        graph_driver=driver,
        llm_client=llm_client,
        embedder=embedder
    )

    # Initialize the graph (creates indices and constraints)
    print("Initializing graph indices...")
    await graphiti.build_indices_and_constraints()

    # Import pages
    print(f"\nImporting {len(pages)} pages...")
    print("This will use OpenAI API for entity extraction (~$0.01-0.10 per page)")
    print("-" * 60)

    success = 0
    errors = []

    for i, page in enumerate(pages):
        progress = f"[{i+1}/{len(pages)}]"
        title = page.get('source_description', 'Unknown').replace('Confluence page: ', '')

        try:
            print(f"{progress} Processing: {title[:50]}...")

            # Parse timestamp
            ref_time = datetime.now(timezone.utc)
            if page.get('reference_time'):
                try:
                    ts = page['reference_time'].replace('Z', '+00:00')
                    ref_time = datetime.fromisoformat(ts)
                except:
                    pass

            # Truncate content if too long (to manage API costs)
            content = page['content'][:8000] if len(page['content']) > 8000 else page['content']

            # Add as episode
            await graphiti.add_episode(
                name=page['name'],
                episode_body=content,
                source=EpisodeType.text,
                source_description=page.get('source_description', title),
                reference_time=ref_time,
                group_id='confluence-oc'  # Group all OC pages together
            )

            success += 1

            # Small delay to avoid rate limits
            await asyncio.sleep(1)

        except Exception as e:
            error_msg = str(e)
            print(f"{progress} ERROR: {title[:30]} - {error_msg[:60]}")
            errors.append({'title': title, 'error': error_msg})

            # Longer delay on errors (might be rate limit)
            if 'rate' in error_msg.lower() or '429' in error_msg:
                print("Rate limited, waiting 60s...")
                await asyncio.sleep(60)
            else:
                await asyncio.sleep(2)

    # Summary
    print("\n" + "=" * 60)
    print("Import Summary")
    print("=" * 60)
    print(f"Total pages: {len(pages)}")
    print(f"Imported: {success}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nFirst 5 errors:")
        for e in errors[:5]:
            print(f"  - {e['title'][:40]}: {e['error'][:50]}")

    # Close connection (use graphiti.close() per Context7 docs)
    await graphiti.close()

    print("\nImport complete!")
    print(f"Query with: search_nodes('your query', group_ids=['confluence-oc'])")
    return success, errors

if __name__ == "__main__":
    result = asyncio.run(main())
