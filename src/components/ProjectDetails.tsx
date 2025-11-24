/**
 * ProjectDetails Component
 *
 * Expandable details panel shown when a project row is expanded.
 * Displays comprehensive metadata including uptime, memory, git status,
 * and additional action buttons.
 *
 * Wave 2 - Compact List View Implementation
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Cpu,
  GitBranch,
  Link as LinkIcon,
  Calendar,
  FolderOpen,
  RotateCw,
  Copy,
  FileText,
  X,
  Play,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { ProjectMetadata, ProjectAction } from '../types';
import {
  detailsContainerVariants,
  detailsItemVariants,
} from '../animations/list-animations';
import { formatBytes, formatUptime, getMemoryTier, isRunning } from '../types';

/**
 * Props for ProjectDetails component
 */
export interface ProjectDetailsProps {
  readonly project: ProjectMetadata;
  readonly onAction: (action: ProjectAction) => void;
  readonly isLoading?: boolean;
  readonly error?: string;
  readonly className?: string;
}

/**
 * Props for MetadataField sub-component
 */
interface MetadataFieldProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tier?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Props for AdditionalActions sub-component
 */
interface AdditionalActionsProps {
  project: ProjectMetadata;
  onAction: (action: ProjectAction) => void;
}

/**
 * Utility: Format timestamp to relative time
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Utility: Combine class names
 */
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * MetadataField Component
 *
 * Displays a single metadata field with icon, label, and value.
 * Supports tier-based color coding for memory usage.
 */
function MetadataField({ icon, label, value, tier }: MetadataFieldProps) {
  const tierColors = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div
          className={cn(
            'text-sm font-medium',
            tier && tierColors[tier]
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/**
 * AdditionalActions Component
 *
 * Action toolbar shown in expanded state.
 * Different buttons shown based on project state (running vs stopped).
 */
function AdditionalActions({ project, onAction }: AdditionalActionsProps) {
  const running = isRunning(project);

  const handleCopyPort = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(project.port.toString());
    // TODO: Show toast notification
    onAction({ type: 'copyPort', projectName: project.name });
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(project.url);
    // TODO: Show toast notification
    onAction({ type: 'copyUrl', projectName: project.name });
  };

  return (
    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
      {running ? (
        <>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAction({ type: 'restart', projectName: project.name });
            }}
          >
            <RotateCw className="w-3 h-3" />
            Restart
          </button>

          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
            onClick={handleCopyPort}
          >
            <Copy className="w-3 h-3" />
            Copy Port
          </button>

          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors opacity-50 cursor-not-allowed"
            disabled
            title="View logs feature coming soon"
          >
            <FileText className="w-3 h-3" />
            View Logs
          </button>

          <div className="flex-1" />

          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAction({ type: 'stop', projectName: project.name });
            }}
          >
            <X className="w-3 h-3" />
            Force Close
          </button>
        </>
      ) : (
        <>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAction({ type: 'launch', projectName: project.name });
            }}
          >
            <Play className="w-3 h-3" />
            Launch Project
          </button>

          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
            onClick={handleCopyUrl}
          >
            <Copy className="w-3 h-3" />
            Copy URL
          </button>
        </>
      )}
    </div>
  );
}

/**
 * ProjectDetails Component
 *
 * Main expanded details panel component.
 * Shows comprehensive project metadata with stagger animation.
 */
export function ProjectDetails({
  project,
  onAction,
  isLoading,
  error,
  className,
}: ProjectDetailsProps) {
  const running = isRunning(project);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('px-4 py-6 text-center bg-muted/20 border-t border-border', className)}>
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
        <p className="text-xs text-muted-foreground mt-2">Loading details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('px-4 py-6 text-center bg-muted/20 border-t border-border', className)}>
        <AlertCircle className="w-5 h-5 mx-auto text-red-500 mb-2" />
        <p className="text-xs text-muted-foreground">Failed to load metadata</p>
        <button
          className="mt-2 px-3 py-1 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
          onClick={() => {
            // TODO: Implement retry logic
            console.log('Retry loading metadata');
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={detailsContainerVariants}
      initial="hidden"
      animate="visible"
      className={cn('px-4 pb-4 pt-2 bg-muted/20 border-t border-border', className)}
    >
      {/* Metadata Grid */}
      <motion.div
        variants={detailsItemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3"
      >
        {/* Uptime - Only show if running */}
        {running && project.status.uptime !== undefined && (
          <MetadataField
            icon={<Clock className="w-4 h-4" />}
            label="Uptime"
            value={formatUptime(project.status.uptime)}
          />
        )}

        {/* Memory Usage - Only show if available */}
        {project.memory !== undefined && (
          <MetadataField
            icon={<Cpu className="w-4 h-4" />}
            label="Memory"
            value={formatBytes(project.memory)}
            tier={getMemoryTier(project.memory)}
          />
        )}

        {/* Git Status - Only show if available */}
        {project.git && (
          <MetadataField
            icon={<GitBranch className="w-4 h-4" />}
            label="Branch"
            value={
              <div className="flex items-center gap-2 flex-wrap">
                <span>{project.git.branch}</span>
                {project.git.uncommittedChanges > 0 && (
                  <span className="text-yellow-500 text-xs">
                    • {project.git.uncommittedChanges} uncommitted
                  </span>
                )}
                {project.git.ahead > 0 && (
                  <span className="inline-flex items-center text-blue-500 text-xs">
                    <ArrowUp className="w-3 h-3" />
                    {project.git.ahead}
                  </span>
                )}
                {project.git.behind > 0 && (
                  <span className="inline-flex items-center text-red-500 text-xs">
                    <ArrowDown className="w-3 h-3" />
                    {project.git.behind}
                  </span>
                )}
              </div>
            }
          />
        )}

        {/* Project URL */}
        <MetadataField
          icon={<LinkIcon className="w-4 h-4" />}
          label="URL"
          value={
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {project.url}
            </a>
          }
        />

        {/* Last Started - Only show if available */}
        {project.lastStarted && (
          <MetadataField
            icon={<Calendar className="w-4 h-4" />}
            label="Last Started"
            value={formatTimestamp(project.lastStarted)}
          />
        )}

        {/* Project Path */}
        <MetadataField
          icon={<FolderOpen className="w-4 h-4" />}
          label="Path"
          value={
            <code className="text-xs text-muted-foreground font-mono break-all">
              {project.path.split('/').pop() || project.path}
            </code>
          }
        />
      </motion.div>

      {/* Action Toolbar */}
      <motion.div variants={detailsItemVariants}>
        <AdditionalActions project={project} onAction={onAction} />
      </motion.div>
    </motion.div>
  );
}
