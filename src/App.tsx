import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Circle, Loader2, Terminal } from 'lucide-react'
import './App.css'

interface Project {
  name: string
  path: string
}

interface ProjectStatus {
  running: boolean
}

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [statuses, setStatuses] = useState<Record<string, ProjectStatus>>({})
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState<Record<string, boolean>>({})
  const [focusedIndex, setFocusedIndex] = useState(0)

  useEffect(() => {
    fetchProjects()
    const interval = setInterval(checkStatuses, 3000) // Check every 3 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (projects.length > 0) {
      checkStatuses()
    }
  }, [projects])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setLoading(false)
    }
  }

  const checkStatuses = async () => {
    for (const project of projects) {
      try {
        const response = await fetch(`/api/projects/${project.name}/status`)
        const status: ProjectStatus = await response.json()
        setStatuses(prev => ({ ...prev, [project.name]: status }))
      } catch (error) {
        console.error(`Error checking status for ${project.name}:`, error)
      }
    }
  }

  const handleLaunch = async (project: Project) => {
    setLaunching(prev => ({ ...prev, [project.name]: true }))
    try {
      const response = await fetch(`/api/projects/${project.name}/launch`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        // Wait a bit then check status
        setTimeout(() => {
          checkStatuses()
          setLaunching(prev => ({ ...prev, [project.name]: false }))
        }, 2000)
      }
    } catch (error) {
      console.error('Error launching project:', error)
      setLaunching(prev => ({ ...prev, [project.name]: false }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => Math.min(prev + 1, projects.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && projects[focusedIndex]) {
      e.preventDefault()
      const project = projects[focusedIndex]
      if (!statuses[project.name]?.running) {
        handleLaunch(project)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-background p-8"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Projects Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage and launch your development projects
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const isRunning = statuses[project.name]?.running ?? false
            const isLaunching = launching[project.name] ?? false
            const isFocused = index === focusedIndex

            return (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`relative group ${
                  isFocused ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                <div
                  className={`bg-card border border-border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                    isFocused
                      ? 'shadow-lg scale-105'
                      : 'hover:shadow-md hover:scale-102'
                  }`}
                  onClick={() => {
                    if (!isRunning && !isLaunching) {
                      handleLaunch(project)
                    }
                  }}
                  onFocus={() => setFocusedIndex(index)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Terminal className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-card-foreground">
                        {project.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRunning ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 text-green-600"
                        >
                          <Circle className="w-3 h-3 fill-current" />
                          <span className="text-sm font-medium">Running</span>
                        </motion.div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Stopped
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    {isRunning ? (
                      <div className="text-sm text-muted-foreground">
                        Project is running
                      </div>
                    ) : isLaunching ? (
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Launching...</span>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium transition-colors hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLaunch(project)
                        }}
                      >
                        <Play className="w-4 h-4" />
                        Launch Project
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No projects found in the projects directory
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

