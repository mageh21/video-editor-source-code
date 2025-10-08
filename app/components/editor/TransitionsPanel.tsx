"use client";

import React, { useMemo } from 'react';
import { TRANSITIONS } from '@/app/data/transitions';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { addTransition, updateTransition, removeTransition } from '@/app/store/slices/projectSlice';
import { ITransition } from '@/app/types';
import { Sparkles, Trash2 } from 'lucide-react';
import { findAdjacentClipPairs, generateTransitionId } from '@/app/utils/transitions';
import { TransitionPreview } from './TransitionPreview';

export const TransitionsPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const { mediaFiles, betweenClipTransitions, transitionIds, selectedMediaIds } = useAppSelector((state) => state.projectState);
    
    // Get existing transitions with their connected clips
    const existingTransitions = useMemo(() => {
        return transitionIds.map((id) => {
            const transition = betweenClipTransitions[id];
            const fromClip = mediaFiles.find(m => m.id === transition?.fromId);
            const toClip = mediaFiles.find(m => m.id === transition?.toId);
            return {
                ...transition,
                fromClip,
                toClip
            };
        }).filter(t => t.fromClip && t.toClip);
    }, [transitionIds, betweenClipTransitions, mediaFiles]);
    
    // Find adjacent clips (placed close together on timeline)  
    const adjacentClipPairs = useMemo(() => {
        return findAdjacentClipPairs(mediaFiles, betweenClipTransitions);
    }, [mediaFiles, betweenClipTransitions]);
    
    const handleTransitionClick = (transitionTemplate: typeof TRANSITIONS[0]) => {
        if (adjacentClipPairs.length === 0) {
            alert("No adjacent clips found. Place video/image clips side by side on the timeline first.");
            return;
        }
        
        // Try to find a pair that includes selected clips
        let pair = adjacentClipPairs[0]; // Default to first pair
        
        if (selectedMediaIds.length > 0) {
            const selectedPair = adjacentClipPairs.find(p => 
                selectedMediaIds.includes(p.fromClip.id) || selectedMediaIds.includes(p.toClip.id)
            );
            
            if (selectedPair) {
                pair = selectedPair;
            } else {
                // If no adjacent pair includes selected clips, inform user
                console.log("Selected clips are not adjacent. Using first available pair.");
            }
        }
        
        if (transitionTemplate.kind === "none") {
            // Remove existing transition
            if (pair.existingTransition) {
                dispatch(removeTransition(pair.existingTransition.id));
            }
            return;
        }
        
        if (pair.existingTransition) {
            // Update existing transition
            dispatch(updateTransition({
                id: pair.existingTransition.id,
                updates: {
                    kind: transitionTemplate.kind,
                    name: transitionTemplate.name || transitionTemplate.kind,
                    duration: transitionTemplate.duration * 1000, // Convert to milliseconds
                    direction: transitionTemplate.direction,
                }
            }));
        } else {
            // Create new transition
            const newTransition: ITransition = {
                id: generateTransitionId(),
                fromId: pair.fromClip.id,
                toId: pair.toClip.id,
                kind: transitionTemplate.kind,
                name: transitionTemplate.name || transitionTemplate.kind,
                duration: transitionTemplate.duration * 1000, // Convert to milliseconds
                direction: transitionTemplate.direction,
                trackId: `row-${pair.fromClip.row}`,
            };
            
            dispatch(addTransition(newTransition));
            
            // Visual feedback
            console.log(`Applied ${transitionTemplate.name || transitionTemplate.kind} transition between ${pair.fromClip.fileName} and ${pair.toClip.fileName}`);
        }
    };
    
    const handleDeleteTransition = (transitionId: string) => {
        dispatch(removeTransition(transitionId));
    };
    
    return (
        <div className="flex h-full flex-col bg-gray-900">
            <div className="p-4 text-sm text-white font-medium border-b border-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Transitions
            </div>
            
            {adjacentClipPairs.length === 0 && (
                <div className="p-4 text-sm text-gray-400 bg-yellow-500/10 border-b border-gray-800">
                    <p className="font-medium mb-2 text-yellow-400">How to use transitions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Add at least 2 video or image clips to the timeline</li>
                        <li>Place them next to each other (side by side)</li>
                        <li>Click any transition below to add it between clips</li>
                    </ol>
                </div>
            )}
            
            {/* Adjacent clips info - Compact version */}
            {adjacentClipPairs.length > 0 && (
                <div className="px-4 py-2 text-sm border-b border-gray-800 bg-green-500/10">
                    <p className="text-xs text-green-400">
                        {adjacentClipPairs.length} clip pair{adjacentClipPairs.length !== 1 ? 's' : ''} ready
                    </p>
                </div>
            )}
            
            {/* Existing transitions - Compact scrollable list */}
            {existingTransitions.length > 0 && (
                <div className="border-b border-gray-800">
                    <div className="px-4 py-1.5 text-xs font-medium text-gray-400 bg-gray-800/50">
                        Active ({existingTransitions.length})
                    </div>
                    <div className="max-h-24 overflow-y-auto">
                        {existingTransitions.map((transition) => (
                            <div
                                key={transition.id}
                                className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-800 group border-b border-gray-800/50 last:border-0"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded bg-purple-500/20 flex-shrink-0 overflow-hidden">
                                        <TransitionPreview 
                                            kind={transition.kind} 
                                            direction={transition.direction}
                                            name={transition.name}
                                        />
                                    </div>
                                    <div className="text-xs min-w-0">
                                        <div className="capitalize text-gray-300 truncate">{transition.name || transition.kind}</div>
                                        <div className="text-[10px] text-gray-500 truncate">
                                            {transition.fromClip?.fileName?.split('.')[0]} → {transition.toClip?.fileName?.split('.')[0]}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteTransition(transition.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/20 rounded flex-shrink-0 ml-2"
                                    title="Remove transition"
                                >
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Transition gallery */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-3 gap-1.5 p-3">
                    {TRANSITIONS.map((transition) => {
                        const isApplied = existingTransitions.some(t => t.kind === transition.kind);
                        
                        return (
                            <div
                                key={transition.id}
                                onClick={() => handleTransitionClick(transition)}
                                className={`cursor-pointer group transition-all relative hover:scale-105 ${
                                    isApplied ? 'ring-2 ring-blue-400' : ''
                                }`}
                                title={transition.name || transition.kind}
                            >
                                <div className="w-full aspect-square rounded-md bg-gray-800 hover:ring-2 hover:ring-blue-400 transition-all overflow-hidden">
                                    <TransitionPreview 
                                        kind={transition.kind} 
                                        direction={transition.direction}
                                        name={transition.name}
                                    />
                                </div>
                                {isApplied && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
                                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                )}
                                <div className="text-gray-400 text-[10px] mt-0.5 text-center capitalize truncate px-1">
                                    {transition.kind === "none" ? "Remove" : (transition.name || transition.kind)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};