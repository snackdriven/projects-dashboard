/**
 * Animation System for Compact List View
 *
 * This module provides reusable Framer Motion animation variants and hooks
 * for the compact project list with expandable details.
 *
 * @module list-animations
 */

import { useEffect, useState } from 'react';
import type { Variants, Transition } from 'framer-motion';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

/**
 * Row expand/collapse animation variants
 * Smoothly transitions between collapsed (48px) and expanded (auto height)
 *
 * @example
 * <motion.div variants={rowVariants} animate={isExpanded ? 'expanded' : 'collapsed'}>
 */
export const rowVariants: Variants = {
  collapsed: {
    height: 48,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    }
  }
};

/**
 * Status indicator animation variants
 * Different pulse animations for running, launching, and stopped states
 *
 * @example
 * <motion.div variants={statusDotVariants} animate={status}>
 */
export const statusDotVariants: Variants = {
  stopped: {
    opacity: 0.5,
    scale: 1,
    transition: { duration: 0.2 }
  },
  running: {
    opacity: [1, 0.5, 1],
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  launching: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.2, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  error: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 }
  }
};

/**
 * Action button animation variants
 * Fades in/out with slight horizontal movement on row hover
 *
 * @example
 * <motion.button variants={actionButtonVariants} animate={isHovered ? 'visible' : 'hidden'}>
 */
export const actionButtonVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Row background hover animation variants
 * Subtle background highlight on hover
 *
 * @example
 * <motion.div variants={rowHoverVariants} animate={isHovered ? 'hover' : 'idle'}>
 */
export const rowHoverVariants: Variants = {
  idle: {
    backgroundColor: 'transparent',
    transition: { duration: 0.2 }
  },
  hover: {
    backgroundColor: 'rgba(var(--muted), 0.5)',
    transition: { duration: 0.2 }
  }
};

/**
 * Focus ring animation variants
 * Smooth spring-based focus indicator for keyboard navigation
 *
 * @example
 * <motion.div variants={focusRingVariants} animate={isFocused ? 'focused' : 'unfocused'}>
 */
export const focusRingVariants: Variants = {
  focused: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  unfocused: {
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

/**
 * Expandable details container animation variants
 * Controls stagger animation for child elements
 *
 * @example
 * <motion.div variants={detailsContainerVariants} animate="visible">
 */
export const detailsContainerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

/**
 * Individual detail item animation variants
 * Used with detailsContainerVariants for staggered reveal
 *
 * @example
 * <motion.div variants={detailsItemVariants}>
 */
export const detailsItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Loading shimmer animation variants
 * Creates a left-to-right shimmer effect for skeleton loading states
 *
 * @example
 * <motion.div variants={shimmerVariants} animate="animate" />
 */
export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

/**
 * List container animation variants
 * Controls stagger animation when list first mounts
 *
 * @example
 * <motion.div variants={listContainerVariants} initial="hidden" animate="visible">
 */
export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

/**
 * Individual list item animation variants
 * Used with listContainerVariants for staggered initial reveal
 *
 * @example
 * <motion.div variants={listItemVariants}>
 */
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

/**
 * Compact chevron icon rotation variants
 * Rotates chevron icon when row expands/collapses
 *
 * @example
 * <motion.div variants={chevronVariants} animate={isExpanded ? 'expanded' : 'collapsed'}>
 */
export const chevronVariants: Variants = {
  collapsed: {
    rotate: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  expanded: {
    rotate: 180,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook for row expand/collapse animation
 * Returns animation props for Framer Motion components
 *
 * @param isExpanded - Whether the row is expanded
 * @returns Animation props object
 *
 * @example
 * const expandProps = useExpandAnimation(isExpanded);
 * return <motion.div {...expandProps}>Content</motion.div>;
 */
export function useExpandAnimation(isExpanded: boolean) {
  const reducedMotion = useReducedMotion();

  return {
    initial: 'collapsed',
    animate: isExpanded ? 'expanded' : 'collapsed',
    variants: rowVariants,
    transition: reducedMotion ? { duration: 0 } : undefined
  };
}

/**
 * Hook for status indicator animation
 * Returns animation props based on project status
 *
 * @param status - Current project status
 * @returns Animation props object
 *
 * @example
 * const statusProps = useStatusAnimation(status);
 * return <motion.div {...statusProps}>●</motion.div>;
 */
export function useStatusAnimation(status: 'stopped' | 'running' | 'launching' | 'error') {
  const reducedMotion = useReducedMotion();

  return {
    animate: status,
    variants: statusDotVariants,
    transition: reducedMotion ? { duration: 0 } : undefined
  };
}

/**
 * Hook for hover animation
 * Manages hover state and returns animation props
 *
 * @returns Object with hover state and animation props
 *
 * @example
 * const { isHovered, hoverProps, animationProps } = useHoverAnimation();
 * return <motion.div {...hoverProps} {...animationProps}>Content</motion.div>;
 */
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useReducedMotion();

  return {
    isHovered,
    hoverProps: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    },
    animationProps: {
      variants: actionButtonVariants,
      animate: isHovered ? 'visible' : 'hidden',
      transition: reducedMotion ? { duration: 0 } : undefined
    }
  };
}

/**
 * Hook for focus ring animation
 * Returns animation props for keyboard navigation focus indicator
 *
 * @param isFocused - Whether the element is focused
 * @returns Animation props object
 *
 * @example
 * const focusProps = useFocusAnimation(isFocused);
 * return <motion.div {...focusProps}>Focus ring</motion.div>;
 */
export function useFocusAnimation(isFocused: boolean) {
  const reducedMotion = useReducedMotion();

  return {
    animate: isFocused ? 'focused' : 'unfocused',
    variants: focusRingVariants,
    transition: reducedMotion ? { duration: 0 } : undefined
  };
}

/**
 * Hook for details panel animation
 * Returns animation props for expandable content with stagger effect
 *
 * @param isExpanded - Whether the details panel is expanded
 * @returns Animation props for container and items
 *
 * @example
 * const { containerProps, itemProps } = useDetailsAnimation(isExpanded);
 * return (
 *   <motion.div {...containerProps}>
 *     <motion.div {...itemProps}>Item 1</motion.div>
 *     <motion.div {...itemProps}>Item 2</motion.div>
 *   </motion.div>
 * );
 */
export function useDetailsAnimation(isExpanded: boolean) {
  const reducedMotion = useReducedMotion();

  return {
    containerProps: {
      variants: detailsContainerVariants,
      initial: 'hidden',
      animate: isExpanded ? 'visible' : 'hidden',
      transition: reducedMotion ? { duration: 0 } : undefined
    },
    itemProps: {
      variants: detailsItemVariants,
      transition: reducedMotion ? { duration: 0 } : undefined
    }
  };
}

/**
 * Hook for list mount animation
 * Returns animation props for initial list reveal with stagger
 *
 * @returns Animation props for container and items
 *
 * @example
 * const { containerProps, itemProps } = useListAnimation();
 * return (
 *   <motion.div {...containerProps}>
 *     {items.map(item => (
 *       <motion.div key={item.id} {...itemProps}>{item.name}</motion.div>
 *     ))}
 *   </motion.div>
 * );
 */
export function useListAnimation() {
  const reducedMotion = useReducedMotion();

  return {
    containerProps: {
      variants: listContainerVariants,
      initial: 'hidden',
      animate: 'visible',
      transition: reducedMotion ? { duration: 0 } : undefined
    },
    itemProps: {
      variants: listItemVariants,
      transition: reducedMotion ? { duration: 0 } : undefined
    }
  };
}

/**
 * Hook to detect reduced motion preference
 * Respects user's accessibility settings
 *
 * @returns Boolean indicating if reduced motion is preferred
 *
 * @example
 * const reducedMotion = useReducedMotion();
 * const duration = reducedMotion ? 0 : 0.3;
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get animation configuration based on reduced motion preference
 * Returns zero duration if reduced motion is preferred
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @param defaultDuration - Default animation duration in seconds
 * @returns Transition configuration object
 *
 * @example
 * const transition = getAnimationConfig(reducedMotion, 0.3);
 */
export function getAnimationConfig(
  reducedMotion: boolean,
  defaultDuration: number = 0.3
): Transition {
  return reducedMotion
    ? { duration: 0 }
    : { duration: defaultDuration };
}

/**
 * Get spring configuration based on reduced motion preference
 * Returns instant transition if reduced motion is preferred
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @returns Spring transition configuration
 *
 * @example
 * const springConfig = getSpringConfig(reducedMotion);
 */
export function getSpringConfig(reducedMotion: boolean): Transition {
  return reducedMotion
    ? { duration: 0 }
    : {
        type: 'spring',
        stiffness: 300,
        damping: 20
      };
}

/**
 * Create a stagger configuration based on reduced motion preference
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @param staggerDelay - Delay between each child animation in seconds
 * @returns Stagger transition configuration
 *
 * @example
 * const staggerConfig = getStaggerConfig(reducedMotion, 0.05);
 */
export function getStaggerConfig(
  reducedMotion: boolean,
  staggerDelay: number = 0.05
): Transition {
  return reducedMotion
    ? { staggerChildren: 0 }
    : {
        staggerChildren: staggerDelay,
        delayChildren: staggerDelay * 2
      };
}

/**
 * Performance optimization: Check if element should animate
 * Disables animations for elements outside viewport or on slow devices
 *
 * @param element - DOM element reference
 * @returns Boolean indicating if animations should be enabled
 *
 * @example
 * const shouldAnimate = shouldElementAnimate(elementRef.current);
 * if (!shouldAnimate) return <div>Static content</div>;
 */
export function shouldElementAnimate(element: HTMLElement | null): boolean {
  if (!element) return false;

  // Check if element is in viewport
  const rect = element.getBoundingClientRect();
  const isInViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );

  return isInViewport;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Project status type for status animations
 */
export type ProjectStatus = 'stopped' | 'running' | 'launching' | 'error';

/**
 * Row animation state type
 */
export type RowAnimationState = 'collapsed' | 'expanded';

/**
 * Animation state for visibility
 */
export type VisibilityState = 'hidden' | 'visible';
