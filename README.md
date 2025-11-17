# Projects Dashboard

A centralized dashboard for managing and launching your development projects. Built with React, TypeScript, and Vite.

## Features

- 🚀 **Quick Launch**: Launch any project with a single click
- 📊 **Status Monitoring**: Real-time status checking for all projects
- ⌨️ **Keyboard Navigation**: Full keyboard support for efficient navigation
- 🎨 **Smooth Animations**: Beautiful, smooth animations powered by Framer Motion
- 🎯 **Single User**: Designed for personal development use

## Prerequisites

- Node.js 18+ and npm
- All your projects should be in `C:\Users\bette\Desktop\projects\`

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

### Windows
Double-click `launch.bat` or run:
```bash
npm run dev
```

### Linux/Mac
Run:
```bash
chmod +x launch.sh
./launch.sh
```

Or:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## Project Structure

```
projects-dashboard/
├── src/           # React frontend
├── server/        # Express backend
├── launch.sh      # Launch script (Linux/Mac)
├── launch.bat     # Launch script (Windows)
└── package.json
```

## How It Works

1. The backend server scans the `projects` directory for subdirectories
2. Each project is displayed as a card in the dashboard
3. Clicking "Launch Project" opens a new terminal window and runs `npm run dev` in that project's directory
4. The dashboard periodically checks if projects are running

## Keyboard Navigation

- `↑` / `↓`: Navigate between projects
- `Enter`: Launch the focused project (if not running)

## Development

- Frontend runs on port `5173`
- Backend API runs on port `3001`
- Both start concurrently with `npm run dev`

## License

Private project for personal use.

