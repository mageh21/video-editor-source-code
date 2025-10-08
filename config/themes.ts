// Caption highlighting theme configuration
export const WORD_HIGHLIGHT_COLOR = '#3B82F6'; // Default blue color
export const WORD_HIGHLIGHT_BACKGROUND = 'rgba(59, 130, 246, 0.2)'; // Light blue background

export const HIGHLIGHT_STYLES = {
  default: {
    color: WORD_HIGHLIGHT_COLOR,
    backgroundColor: WORD_HIGHLIGHT_BACKGROUND,
    fontWeight: 'bold' as const,
    borderRadius: '4px',
    padding: '2px 4px'
  },
  monospace: {
    color: WORD_HIGHLIGHT_COLOR,
    backgroundColor: WORD_HIGHLIGHT_BACKGROUND,
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontWeight: 'bold' as const,
    borderRadius: '4px',
    padding: '2px 4px'
  },
  emphasis: {
    color: '#EF4444', // Red
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    fontWeight: 'bold' as const,
    fontStyle: 'italic' as const,
    borderRadius: '4px',
    padding: '2px 4px'
  },
  success: {
    color: '#10B981', // Green
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    fontWeight: 'bold' as const,
    borderRadius: '4px',
    padding: '2px 4px'
  },
  warning: {
    color: '#F59E0B', // Yellow/Orange
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    fontWeight: 'bold' as const,
    borderRadius: '4px',
    padding: '2px 4px'
  }
};

export type HighlightStyle = keyof typeof HIGHLIGHT_STYLES;