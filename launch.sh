#!/bin/bash

# Navigate to the dashboard directory
cd "$(dirname "$0")"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the dashboard
echo "Starting Projects Dashboard..."
npm run dev

