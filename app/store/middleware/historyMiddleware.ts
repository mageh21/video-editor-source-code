import { Middleware } from '@reduxjs/toolkit';
import {
  NON_HISTORY_ACTIONS,
  DEBOUNCED_ACTIONS,
  cloneState,
  statesAreDifferent,
  trimHistory,
  MAX_HISTORY_SIZE
} from '@/app/utils/historyUtils';

// Debounce timers for different action types
const debounceTimers: Record<string, NodeJS.Timeout> = {};

export const historyMiddleware: Middleware = (store) => (next) => (action) => {
  // Get the current state before the action
  const previousState = store.getState().projectState;
  
  // Execute the action
  const result = next(action);
  
  // Get the new state after the action
  const currentState = store.getState().projectState;
  
  // Check if this action should be recorded in history
  const actionType = (action as any).type.split('/').pop() || (action as any).type;
  const shouldRecord = !NON_HISTORY_ACTIONS.includes(actionType) &&
                      !(action as any).type.startsWith('@@') && // Ignore Redux internal actions
                      !(action as any).type.includes('/recordHistory'); // Don't record history actions
  
  if (shouldRecord) {
    // Check if this action should be debounced
    const debounceDelay = DEBOUNCED_ACTIONS[(action as any).type];
    
    if (debounceDelay) {
      // Clear existing timer for this action type
      if (debounceTimers[(action as any).type]) {
        clearTimeout(debounceTimers[(action as any).type]);
      }
      
      // Set new debounce timer
      debounceTimers[(action as any).type] = setTimeout(() => {
        recordHistoryEntry(store, previousState, action);
        delete debounceTimers[(action as any).type];
      }, debounceDelay);
    } else {
      // Record immediately for non-debounced actions
      recordHistoryEntry(store, previousState, action);
    }
  }
  
  return result;
};

function recordHistoryEntry(store: any, previousState: any, action: any) {
  const currentState = store.getState().projectState;
  
  // Only record if the state actually changed
  const previousSnapshot = cloneState(previousState);
  const currentSnapshot = cloneState(currentState);
  
  if (statesAreDifferent(previousSnapshot, currentSnapshot)) {
    // Dispatch the recordHistory action
    store.dispatch({
      type: 'projectState/recordHistory',
      payload: {
        state: previousSnapshot,
        action: {
          type: (action as any).type,
          description: action.meta?.description || (action as any).type,
          timestamp: Date.now(),
        },
      },
    });
  }
}