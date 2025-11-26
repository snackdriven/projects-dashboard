#!/bin/bash
# Start Docker daemon in WSL

echo "Starting Docker daemon..."
sudo service docker start

# Wait for Docker to be ready
echo "Waiting for Docker to start..."
sleep 2

# Check if Docker is running
if docker ps >/dev/null 2>&1; then
    echo "✓ Docker is running"
    docker --version
else
    echo "✗ Docker failed to start"
    echo "Try: sudo service docker status"
    exit 1
fi
