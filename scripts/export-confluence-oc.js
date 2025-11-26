#!/usr/bin/env node
/**
 * Export Confluence OC Space to plain text for Graphiti import
 *
 * Usage: node scripts/export-confluence-oc.js
 *
 * Exports all pages from the OC (Orange County) Confluence space
 * as plain text JSON files ready for Graphiti ingestion.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}

// Configuration
const CONFLUENCE_BASE = 'https://chorusapp.atlassian.net/wiki/rest/api';
const SPACE_KEY = process.argv[2] || 'OC';
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'confluence-export');

// Auth from environment
const email = process.env.ATLASSIAN_EMAIL || process.env.JIRA_EMAIL;
const token = process.env.ATLASSIAN_API_TOKEN || process.env.JIRA_API_TOKEN;

if (!email || !token) {
  console.error('Missing ATLASSIAN_EMAIL or ATLASSIAN_API_TOKEN in environment');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');

/**
 * Strip HTML tags and decode entities to get plain text
 */
function htmlToPlainText(html) {
  if (!html) return '';

  // Remove script and style tags with their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Replace common block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&rsquo;/g, "'");
  text = text.replace(/&lsquo;/g, "'");
  text = text.replace(/&rdquo;/g, '"');
  text = text.replace(/&ldquo;/g, '"');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');
  text = text.replace(/&bull;/g, '•');

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();

  return text;
}

/**
 * Fetch a URL with authentication
 */
async function fetchConfluence(endpoint) {
  const url = endpoint.startsWith('http') ? endpoint : `${CONFLUENCE_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Confluence API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all pages in a space (handles pagination)
 */
async function getAllPages(spaceKey) {
  const pages = [];
  let start = 0;
  const limit = 50;

  console.log(`Fetching pages from ${spaceKey} space...`);

  while (true) {
    const data = await fetchConfluence(
      `/content?spaceKey=${spaceKey}&type=page&limit=${limit}&start=${start}&expand=metadata.labels`
    );

    pages.push(...data.results);
    console.log(`  Fetched ${pages.length} pages...`);

    if (data.results.length < limit) break;
    start += limit;
  }

  return pages;
}

/**
 * Get full page content with body
 */
async function getPageContent(pageId) {
  const data = await fetchConfluence(
    `/content/${pageId}?expand=body.storage,version,ancestors`
  );
  return data;
}

/**
 * Main export function
 */
async function exportOCSpace() {
  console.log('='.repeat(60));
  console.log('Confluence OC Space Export');
  console.log('='.repeat(60));

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get all pages
  const pages = await getAllPages(SPACE_KEY);
  console.log(`\nFound ${pages.length} pages in ${SPACE_KEY} space\n`);

  const exportedPages = [];
  const errors = [];

  // Export each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const progress = `[${i + 1}/${pages.length}]`;

    try {
      console.log(`${progress} Exporting: ${page.title}`);

      // Get full content
      const fullPage = await getPageContent(page.id);

      // Extract plain text from HTML body
      const htmlBody = fullPage.body?.storage?.value || '';
      const plainText = htmlToPlainText(htmlBody);

      // Build page metadata
      const pageData = {
        id: page.id,
        title: page.title,
        spaceKey: SPACE_KEY,
        url: `https://chorusapp.atlassian.net/wiki/spaces/${SPACE_KEY}/pages/${page.id}`,
        version: fullPage.version?.number || 1,
        lastModified: fullPage.version?.when || null,
        modifiedBy: fullPage.version?.by?.displayName || null,
        labels: (page.metadata?.labels?.results || []).map(l => l.name),
        ancestors: (fullPage.ancestors || []).map(a => a.title),
        contentLength: plainText.length,
        content: plainText
      };

      exportedPages.push(pageData);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));

    } catch (error) {
      console.error(`${progress} ERROR: ${page.title} - ${error.message}`);
      errors.push({ id: page.id, title: page.title, error: error.message });
    }
  }

  // Write output files
  const timestamp = new Date().toISOString().split('T')[0];

  // Full export (all pages in one file)
  const fullExportPath = path.join(OUTPUT_DIR, `oc-space-export-${timestamp}.json`);
  fs.writeFileSync(fullExportPath, JSON.stringify(exportedPages, null, 2));
  console.log(`\nWrote full export: ${fullExportPath}`);

  // Summary/manifest file
  const summary = {
    exportDate: new Date().toISOString(),
    spaceKey: SPACE_KEY,
    totalPages: pages.length,
    exportedPages: exportedPages.length,
    errors: errors.length,
    pages: exportedPages.map(p => ({
      id: p.id,
      title: p.title,
      url: p.url,
      labels: p.labels,
      contentLength: p.contentLength
    })),
    errorDetails: errors
  };

  const summaryPath = path.join(OUTPUT_DIR, `oc-space-manifest-${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote manifest: ${summaryPath}`);

  // Graphiti-ready format (one episode per page for ingestion)
  const graphitiFormat = exportedPages.map(p => ({
    name: `confluence:${SPACE_KEY}:${p.id}`,
    episode_type: 'document',
    source: 'confluence',
    source_description: `Confluence page: ${p.title}`,
    content: `# ${p.title}\n\nSpace: ${SPACE_KEY}\nURL: ${p.url}\nLabels: ${p.labels.join(', ') || 'none'}\nLast Modified: ${p.lastModified || 'unknown'}\nPath: ${p.ancestors.join(' > ') || 'root'}\n\n${p.content}`,
    reference_time: p.lastModified || new Date().toISOString()
  }));

  const graphitiPath = path.join(OUTPUT_DIR, `oc-space-graphiti-${timestamp}.json`);
  fs.writeFileSync(graphitiPath, JSON.stringify(graphitiFormat, null, 2));
  console.log(`Wrote Graphiti format: ${graphitiPath}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Export Summary');
  console.log('='.repeat(60));
  console.log(`Total pages: ${pages.length}`);
  console.log(`Exported: ${exportedPages.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.title}: ${e.error}`));
  }

  return { exportedPages, errors, summary };
}

// Run export
exportOCSpace()
  .then(result => {
    console.log('\nExport complete!');
    process.exit(result.errors.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Export failed:', error);
    process.exit(1);
  });
