import { TransitionTemplate, TransitionStyle, transitionTemplates } from './transition-templates';

export interface TransitionConfig {
  type: string;
  duration: number; // in seconds
  speed?: number; // speed multiplier (0.5 = slower, 2 = faster)
}

/**
 * Calculate transition progress based on current time and transition config
 */
export const calculateTransitionProgress = (
  currentTime: number,
  startTime: number,
  endTime: number,
  transitionDuration: number,
  isEntrance: boolean
): number => {
  if (isEntrance) {
    // Entrance transition starts at the beginning
    const elapsed = currentTime - startTime;
    if (elapsed <= 0) return 0;
    if (elapsed >= transitionDuration) return 1;
    return elapsed / transitionDuration;
  } else {
    // Exit transition ends at the end
    const remaining = endTime - currentTime;
    if (remaining >= transitionDuration) return 0;
    if (remaining <= 0) return 1;
    return 1 - (remaining / transitionDuration);
  }
};

/**
 * Apply transition styles based on current progress
 */
export const applyTransition = (
  templateId: string,
  progress: number,
  isEntrance: boolean
): TransitionStyle => {
  const template = transitionTemplates[templateId];
  if (!template) {
    return {};
  }

  return isEntrance ? template.enter(progress) : template.exit(progress);
};

/**
 * Get transition styles for a media element at a specific time
 */
export const getTransitionStyles = (
  currentTime: number,
  startTime: number,
  endTime: number,
  entranceTransition?: TransitionConfig,
  exitTransition?: TransitionConfig
): TransitionStyle => {
  let styles: TransitionStyle = {};

  // Apply entrance transition if within range
  if (entranceTransition && entranceTransition.type !== 'none') {
    const duration = entranceTransition.duration * (entranceTransition.speed || 1);
    const progress = calculateTransitionProgress(
      currentTime,
      startTime,
      endTime,
      duration,
      true
    );

    if (progress > 0 && progress < 1) {
      styles = applyTransition(entranceTransition.type, progress, true);
    }
  }

  // Apply exit transition if within range
  if (exitTransition && exitTransition.type !== 'none') {
    const duration = exitTransition.duration * (exitTransition.speed || 1);
    const progress = calculateTransitionProgress(
      currentTime,
      startTime,
      endTime,
      duration,
      false
    );

    if (progress > 0 && progress <= 1) {
      // Exit transition overrides entrance if both are active
      styles = applyTransition(exitTransition.type, progress, false);
    }
  }

  return styles;
};

/**
 * Check if we're in a transition phase
 */
export const isInTransition = (
  currentTime: number,
  startTime: number,
  endTime: number,
  entranceTransition?: TransitionConfig,
  exitTransition?: TransitionConfig
): boolean => {
  if (entranceTransition && entranceTransition.type !== 'none') {
    const duration = entranceTransition.duration * (entranceTransition.speed || 1);
    if (currentTime >= startTime && currentTime < startTime + duration) {
      return true;
    }
  }

  if (exitTransition && exitTransition.type !== 'none') {
    const duration = exitTransition.duration * (exitTransition.speed || 1);
    if (currentTime > endTime - duration && currentTime <= endTime) {
      return true;
    }
  }

  return false;
};

/**
 * Get available transition types
 */
export const getAvailableTransitions = (): Array<{ value: string; label: string; preview: string }> => {
  return [
    { value: 'none', label: 'None', preview: 'No transition' },
    ...Object.entries(transitionTemplates).map(([key, template]) => ({
      value: key,
      label: template.name,
      preview: template.preview,
    })),
  ];
};

/**
 * Get default transition config
 */
export const getDefaultTransitionConfig = (): TransitionConfig => ({
  type: 'fade',
  duration: 0.5,
  speed: 1,
});