#!/bin/bash

# Test script for the new /api/projects/:name/metadata endpoint
# This demonstrates all features of the enhanced backend API

echo "=========================================="
echo "Testing New Metadata API Endpoint"
echo "=========================================="
echo ""

# Test 1: Get metadata for a stopped project
echo "Test 1: Get metadata for stopped project (google-calendar-clone)"
echo "-------------------------------------------------------------------"
curl -s http://localhost:3001/api/projects/google-calendar-clone/metadata | python3 -m json.tool
echo ""
echo ""

# Test 2: Get metadata for another project
echo "Test 2: Get metadata for task-manager"
echo "--------------------------------------"
curl -s http://localhost:3001/api/projects/task-manager/metadata | python3 -m json.tool
echo ""
echo ""

# Test 3: Test caching (second request should be faster)
echo "Test 3: Test caching performance"
echo "---------------------------------"
echo "First request (not cached):"
time curl -s http://localhost:3001/api/projects/jira-wrapper/metadata > /dev/null
echo ""
echo "Second request (cached - should be faster):"
time curl -s http://localhost:3001/api/projects/jira-wrapper/metadata > /dev/null
echo ""
echo ""

# Test 4: Test error handling - non-existent project
echo "Test 4: Error handling - non-existent project"
echo "----------------------------------------------"
curl -s http://localhost:3001/api/projects/does-not-exist/metadata | python3 -m json.tool
echo ""
echo ""

# Test 5: Backwards compatibility - old status endpoint
echo "Test 5: Backwards compatibility - old /status endpoint"
echo "-------------------------------------------------------"
curl -s http://localhost:3001/api/projects/google-calendar-clone/status | python3 -m json.tool
echo ""
echo ""

# Test 6: List all projects (existing endpoint)
echo "Test 6: List all projects (existing endpoint)"
echo "----------------------------------------------"
curl -s http://localhost:3001/api/projects | python3 -m json.tool | head -20
echo "... (truncated)"
echo ""
echo ""

echo "=========================================="
echo "All tests completed!"
echo "=========================================="
