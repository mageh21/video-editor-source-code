import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { ITransition } from "@/app/types";

interface TransitionOverlayProps {
  transition: ITransition;
  fromStart: number;
  fromEnd: number;
  toStart: number;
  toEnd: number;
  fps: number;
}

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
  transition,
  fromStart,
  fromEnd,
  toStart,
  toEnd,
  fps,
}) => {
  const frame = useCurrentFrame();
  
  // Calculate transition timing
  const transitionDurationFrames = Math.round((transition.duration / 1000) * fps);
  
  // For overlapping clips, the transition happens in the overlap region
  const overlapStart = Math.max(fromStart, toStart);
  const overlapEnd = Math.min(fromEnd, toEnd);
  
  let transitionStartFrame: number;
  let transitionEndFrame: number;
  
  if (overlapEnd > overlapStart) {
    // Clips overlap
    const overlapCenter = (overlapStart + overlapEnd) / 2;
    transitionStartFrame = overlapCenter - transitionDurationFrames / 2;
    transitionEndFrame = overlapCenter + transitionDurationFrames / 2;
  } else {
    // Clips don't overlap - transition in the gap
    transitionStartFrame = fromEnd - transitionDurationFrames / 2;
    transitionEndFrame = toStart + transitionDurationFrames / 2;
  }
  
  // Only render during transition period
  if (frame < transitionStartFrame || frame > transitionEndFrame) {
    return null;
  }
  
  // Calculate progress (0 to 1)
  const progress = interpolate(
    frame,
    [transitionStartFrame, transitionEndFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  
  // Get transition type from either 'kind' or 'type' property
  const transitionType = transition.kind || transition.type || "fade";
  
  // Render transition effect based on type
  switch (transitionType) {
    case "fade":
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            opacity: interpolate(progress, [0, 0.5, 1], [0, 1, 0]),
            zIndex: 9999,
          }}
        />
      );
      
    case "slide":
      const slideDirection = transition.direction || "from-left";
      let gradient: string;
      
      switch (slideDirection) {
        case "from-left":
          gradient = `linear-gradient(to right, black ${progress * 100}%, transparent ${progress * 100}%)`;
          break;
        case "from-right":
          gradient = `linear-gradient(to left, black ${progress * 100}%, transparent ${progress * 100}%)`;
          break;
        case "from-top":
          gradient = `linear-gradient(to bottom, black ${progress * 100}%, transparent ${progress * 100}%)`;
          break;
        case "from-bottom":
          gradient = `linear-gradient(to top, black ${progress * 100}%, transparent ${progress * 100}%)`;
          break;
        default:
          gradient = `linear-gradient(to right, black ${progress * 100}%, transparent ${progress * 100}%)`;
      }
      
      return (
        <AbsoluteFill
          style={{
            background: gradient,
            zIndex: 9999,
          }}
        />
      );
      
    case "wipe":
      const wipeDirection = transition.direction || "from-left";
      const wipeProgress = progress * 100;
      const clipPath = 
        wipeDirection === "from-left" ? `inset(0 ${100 - wipeProgress}% 0 0)` :
        wipeDirection === "from-right" ? `inset(0 0 0 ${100 - wipeProgress}%)` :
        wipeDirection === "from-top" ? `inset(0 0 ${100 - wipeProgress}% 0)` :
        wipeDirection === "from-bottom" ? `inset(${100 - wipeProgress}% 0 0 0)` :
        "none";
        
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            clipPath,
            zIndex: 9999,
          }}
        />
      );
      
    case "flip":
      const flipProgress = progress * 180;
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            transform: `rotateY(${flipProgress}deg)`,
            opacity: Math.abs(Math.cos(flipProgress * Math.PI / 180)),
            zIndex: 9999,
          }}
        />
      );
      
    case "clockWipe":
      const angle = progress * 360;
      const x = 50 + 50 * Math.sin(angle * Math.PI / 180);
      const y = 50 - 50 * Math.cos(angle * Math.PI / 180);
      const path = `polygon(50% 50%, 50% 0%, ${x}% ${y}%)`;
      
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            clipPath: path,
            zIndex: 9999,
          }}
        />
      );
      
    case "star":
      const scale = interpolate(progress, [0, 0.5, 1], [0, 1.5, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            transform: `scale(${scale})`,
            transformOrigin: "center",
            zIndex: 9999,
          }}
        />
      );
      
    case "circle":
      const radius = interpolate(progress, [0, 0.5, 1], [0, 100, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            clipPath: `circle(${radius}% at 50% 50%)`,
            zIndex: 9999,
          }}
        />
      );
      
    case "rectangle":
      const rectScale = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            transform: `scale(${rectScale})`,
            transformOrigin: "center",
            zIndex: 9999,
          }}
        />
      );
      
    case "zoom":
      const zoomDirection = transition.name || "zoom in";
      const zoomScale = zoomDirection === "zoom in" 
        ? interpolate(progress, [0, 1], [1, 3])
        : interpolate(progress, [0, 1], [3, 1]);
      const zoomOpacity = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            transform: `scale(${zoomScale})`,
            transformOrigin: "center",
            opacity: zoomOpacity,
            zIndex: 9999,
          }}
        />
      );
      
    case "blur":
      const blurAmount = interpolate(progress, [0, 0.5, 1], [0, 20, 0]);
      const blurOpacity = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            filter: `blur(${blurAmount}px)`,
            opacity: blurOpacity,
            zIndex: 9999,
          }}
        />
      );
      
    case "pixelate":
      // Create pixelated effect using a pattern
      const pixelSize = interpolate(progress, [0, 0.5, 1], [1, 20, 1]);
      const pixelOpacity = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            opacity: pixelOpacity,
            imageRendering: "pixelated",
            transform: `scale(${1/pixelSize})`,
            transformOrigin: "center",
            zIndex: 9999,
          }}
        />
      );
      
    case "dissolve":
      // Random dissolve effect using noise pattern
      const dissolveProgress = progress * 100;
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            maskImage: `radial-gradient(circle at ${dissolveProgress}% ${dissolveProgress}%, transparent ${dissolveProgress}%, black ${dissolveProgress + 10}%)`,
            WebkitMaskImage: `radial-gradient(circle at ${dissolveProgress}% ${dissolveProgress}%, transparent ${dissolveProgress}%, black ${dissolveProgress + 10}%)`,
            zIndex: 9999,
          }}
        />
      );
      
    case "spin":
      const spinRotation = progress * 360;
      const spinScale = interpolate(progress, [0, 0.5, 1], [1, 0.5, 1]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            transform: `rotate(${spinRotation}deg) scale(${spinScale})`,
            transformOrigin: "center",
            opacity: interpolate(progress, [0, 0.5, 1], [0, 1, 0]),
            zIndex: 9999,
          }}
        />
      );
      
    case "squeeze":
      const squeezeDirection = transition.direction || "horizontal";
      const squeezeScale = interpolate(progress, [0, 0.5, 1], [1, 0, 1]);
      const scaleX = squeezeDirection === "horizontal" ? squeezeScale : 1;
      const scaleY = squeezeDirection === "vertical" ? squeezeScale : 1;
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: "center",
            zIndex: 9999,
          }}
        />
      );
      
    case "rotate":
      const rotateAngle = progress * 180;
      const rotateOpacity = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            transform: `rotate(${rotateAngle}deg)`,
            transformOrigin: "center",
            opacity: rotateOpacity,
            zIndex: 9999,
          }}
        />
      );
      
    case "heart":
      const heartScale = interpolate(progress, [0, 0.5, 1], [0, 1.2, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            clipPath: "path('M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z')",
            transform: `scale(${heartScale})`,
            transformOrigin: "center",
            zIndex: 9999,
          }}
        />
      );
      
    case "diamond":
      const diamondScale = interpolate(progress, [0, 0.5, 1], [0, 1.5, 0]);
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            transform: `scale(${diamondScale}) rotate(45deg)`,
            transformOrigin: "center",
            zIndex: 9999,
          }}
        />
      );
      
    case "ripple":
      const rippleScale = interpolate(progress, [0, 1], [0, 3]);
      const rippleOpacity = interpolate(progress, [0, 0.7, 1], [1, 0.3, 0]);
      return (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at center, transparent ${progress * 40}%, black ${progress * 40}%, black ${progress * 60}%, transparent ${progress * 60}%)`,
            transform: `scale(${rippleScale})`,
            transformOrigin: "center",
            opacity: rippleOpacity,
            zIndex: 9999,
          }}
        />
      );
      
    default:
      // Default to fade
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            opacity: interpolate(progress, [0, 0.5, 1], [0, 1, 0]),
            zIndex: 9999,
          }}
        />
      );
  }
};