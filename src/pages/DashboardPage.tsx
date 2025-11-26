import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Ghost } from 'lucide-react'
import { CompactList } from '@/components/CompactList'
import type { ProjectMetadata, ProjectAction, ProjectState } from '@/types'

interface Project {
  name: string
  path: string
}

interface ProjectStatus {
  running: boolean
}

// Constants
const STATUS_CHECK_INTERVAL = 3000 // 3 seconds
const LAUNCH_DEBOUNCE_DELAY = 2000 // 2 seconds

// Port assignments for each project (must match server)
const PROJECT_PORTS: Record<string, number> = {
  'google-calendar-clone': 5173,
  'jira-wrapper': 5174,
  'lastfm-clone': 5175,
  'livejournal-clone': 5176,
  'react-ts-templates': 5177,
  'task-manager': 5178,
  'quantified-life': 5179,
  'chronicle': 3002, // HTTP API server (not Vite)
}

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [statuses, setStatuses] = useState<Record<string, ProjectStatus>>({})
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState<Record<string, boolean>>({})
  const [closing, setClosing] = useState<Record<string, boolean>>({})
  const launchingRef = useRef<Set<string>>(new Set())
  const closingRef = useRef<Set<string>>(new Set())
  const projectsRef = useRef<Project[]>([])
  const statusesRef = useRef<Record<string, ProjectStatus>>({})

  // Keep refs in sync with state
  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    statusesRef.current = statuses
  }, [statuses])

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProjects(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setLoading(false)
    }
  }, [])

  const checkStatuses = useCallback(async () => {
    const currentProjects = projectsRef.current
    if (currentProjects.length === 0) return

    // Use Promise.allSettled for parallel status checks (2025 best practice)
    const statusPromises = currentProjects.map(async (project) => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(project.name)}/status`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const status: ProjectStatus = await response.json()
        return { name: project.name, status }
      } catch (error) {
        console.error(`Error checking status for ${project.name}:`, error)
        return { name: project.name, status: null }
      }
    })

    const results = await Promise.allSettled(statusPromises)
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.status !== null) {
        setStatuses(prev => {
          // Only update if the status actually changed to prevent unnecessary re-renders
          const currentStatus = prev[result.value.name]
          const newStatus = result.value.status
          if (!newStatus || currentStatus?.running === newStatus.running) {
            return prev // No change, return same reference
          }
          return { ...prev, [result.value.name]: newStatus }
        })
      }
    })
  }, [])

  // Set up status checking interval
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (projects.length === 0) return

    // Initial check
    checkStatuses()

    // Set up interval - use ref-based function to avoid dependency on projects array
    const interval = setInterval(() => {
      checkStatuses()
    }, STATUS_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [projects.length, checkStatuses])

  const handleLaunch = useCallback(async (project: Project) => {
    // Prevent duplicate launches (race condition fix)
    if (launchingRef.current.has(project.name) || statuses[project.name]?.running) {
      return
    }

    launchingRef.current.add(project.name)
    setLaunching(prev => ({ ...prev, [project.name]: true }))

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.name)}/launch`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Wait a bit then check status
        setTimeout(() => {
          checkStatuses()
          setLaunching(prev => ({ ...prev, [project.name]: false }))
          launchingRef.current.delete(project.name)
        }, LAUNCH_DEBOUNCE_DELAY)
      } else {
        setLaunching(prev => ({ ...prev, [project.name]: false }))
        launchingRef.current.delete(project.name)
      }
    } catch (error) {
      console.error('Error launching project:', error)
      setLaunching(prev => ({ ...prev, [project.name]: false }))
      launchingRef.current.delete(project.name)
    }
  }, [statuses, checkStatuses])

  const handleForceClose = useCallback(async (project: Project) => {
    // Prevent duplicate closes (race condition fix)
    if (closingRef.current.has(project.name) || !statuses[project.name]?.running) {
      return
    }

    closingRef.current.add(project.name)
    setClosing(prev => ({ ...prev, [project.name]: true }))

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.name)}/close`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Wait a bit then check status
        setTimeout(() => {
          checkStatuses()
          setClosing(prev => ({ ...prev, [project.name]: false }))
          closingRef.current.delete(project.name)
        }, 1000)
      } else {
        setClosing(prev => ({ ...prev, [project.name]: false }))
        closingRef.current.delete(project.name)
      }
    } catch (error) {
      console.error('Error force closing project:', error)
      setClosing(prev => ({ ...prev, [project.name]: false }))
      closingRef.current.delete(project.name)
    }
  }, [statuses, checkStatuses])

  const handleOpenUrl = useCallback((project: Project) => {
    const port = PROJECT_PORTS[project.name] || 5173
    const url = `http://localhost:${port}`
    window.open(url, '_blank')
  }, [])

  /**
   * Transform existing data to ProjectMetadata format for CompactList
   */
  const transformToProjectMetadata = useCallback(
    (
      projects: Project[],
      statuses: Record<string, ProjectStatus>,
      launching: Record<string, boolean>,
      closing: Record<string, boolean>
    ): ProjectMetadata[] => {
      return projects.map(project => {
        const status = statuses[project.name];
        const isLaunching = launching[project.name];
        const isClosing = closing[project.name];

        let projectState: ProjectState;

        if (isLaunching) {
          projectState = { state: 'launching' };
        } else if (isClosing) {
          // Closing state - show as running but will be stopped soon
          projectState = { state: 'running', since: new Date(), uptime: 0 };
        } else if (status?.running) {
          projectState = { state: 'running', since: new Date(), uptime: 0 };
        } else {
          projectState = { state: 'stopped' };
        }

        return {
          name: project.name,
          path: project.path,
          port: PROJECT_PORTS[project.name] || 5173,
          status: projectState,
          url: `http://localhost:${PROJECT_PORTS[project.name] || 5173}`
        };
      });
    },
    []
  );

  /**
   * Unified action handler for all project actions
   */
  const handleProjectAction = useCallback(async (action: ProjectAction) => {
    const project = projects.find(p => p.name === action.projectName);
    if (!project) return;

    switch (action.type) {
      case 'launch':
        await handleLaunch(project);
        break;
      case 'stop':
        await handleForceClose(project);
        break;
      case 'open':
        handleOpenUrl(project);
        break;
      case 'restart':
        await handleForceClose(project);
        // Wait a bit then relaunch
        setTimeout(() => handleLaunch(project), 2000);
        break;
      case 'copyPort':
        const port = PROJECT_PORTS[action.projectName];
        if (port) {
          navigator.clipboard.writeText(port.toString());
          // Optional: Show toast notification
          console.log(`Port ${port} copied to clipboard`);
        }
        break;
      case 'copyUrl':
        const url = `http://localhost:${PROJECT_PORTS[action.projectName] || 5173}`;
        navigator.clipboard.writeText(url);
        console.log(`URL ${url} copied to clipboard`);
        break;
    }
  }, [projects, handleLaunch, handleForceClose, handleOpenUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background spooky-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Ghost className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.p
            className="text-muted-foreground text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Summoning projects...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  const runningCount = Object.values(statuses).filter(s => s?.running).length
  const totalCount = projects.length

  return (
    <div className="min-h-screen bg-background spooky-bg">
      {/* Spooky gradient background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-pink-900/8 via-purple-900/5 via-cyan-900/5 to-indigo-900/8 pointer-events-none" />

      {/* Floating sparkles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-4 h-4 text-orange-400/60" />
        </motion.div>
      ))}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <motion.h1
                className="text-4xl sm:text-5xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="flex items-center gap-3">
                  <motion.span
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="inline-block text-5xl"
                    style={{
                      filter: 'hue-rotate(-30deg) saturate(1.8) brightness(1.2)',
                      textShadow: '0 0 10px rgba(147, 197, 253, 0.5), 0 0 20px rgba(147, 197, 253, 0.3), 0 0 30px rgba(147, 197, 253, 0.2)'
                    }}
                  >
                    👻
                  </motion.span>
                  Projects Dashboard
                </span>
              </motion.h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Summon and manage your development projects
              </p>
            </div>
            {totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 px-4 py-2 bg-card border border-border rounded-lg"
              >
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{runningCount}</div>
                  <div className="text-xs text-muted-foreground">Running</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{totalCount}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Compact List View */}
        {projects.length > 0 ? (
          <CompactList
            projects={transformToProjectMetadata(projects, statuses, launching, closing)}
            onProjectAction={handleProjectAction}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 sm:py-24"
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Ghost className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No projects found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The spirits are quiet... Add projects to get started!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
