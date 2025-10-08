"use client";

import React from 'react';

interface TransitionPreviewProps {
  kind: string;
  direction?: string;
  name?: string;
}

export const TransitionPreview: React.FC<TransitionPreviewProps> = ({ kind, direction, name }) => {
  // Base styles for the preview boxes
  const boxStyle = "absolute w-full h-full";
  const box1Style = `${boxStyle} bg-gradient-to-br from-blue-500 to-purple-500`;
  const box2Style = `${boxStyle} bg-gradient-to-br from-green-500 to-teal-500`;
  
  switch (kind) {
    case "none":
      return (
        <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 text-xs">None</div>
        </div>
      );
      
    case "fade":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-fade-preview`} />
          <style jsx>{`
            @keyframes fade-preview {
              0% { opacity: 0; }
              50% { opacity: 1; }
              100% { opacity: 0; }
            }
            .animate-fade-preview {
              animation: fade-preview 2s infinite;
            }
          `}</style>
        </div>
      );
      
    case "slide":
      const slideClass = 
        direction === "from-left" ? "animate-slide-left" :
        direction === "from-right" ? "animate-slide-right" :
        direction === "from-top" ? "animate-slide-top" :
        "animate-slide-bottom";
      
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} ${slideClass}`} />
          <style jsx>{`
            @keyframes slide-left {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0); }
              100% { transform: translateX(-100%); }
            }
            @keyframes slide-right {
              0% { transform: translateX(100%); }
              50% { transform: translateX(0); }
              100% { transform: translateX(100%); }
            }
            @keyframes slide-top {
              0% { transform: translateY(-100%); }
              50% { transform: translateY(0); }
              100% { transform: translateY(-100%); }
            }
            @keyframes slide-bottom {
              0% { transform: translateY(100%); }
              50% { transform: translateY(0); }
              100% { transform: translateY(100%); }
            }
            .animate-slide-left { animation: slide-left 2s infinite; }
            .animate-slide-right { animation: slide-right 2s infinite; }
            .animate-slide-top { animation: slide-top 2s infinite; }
            .animate-slide-bottom { animation: slide-bottom 2s infinite; }
          `}</style>
        </div>
      );
      
    case "wipe":
      const wipeClass = 
        direction === "from-left" ? "animate-wipe-left" :
        direction === "from-right" ? "animate-wipe-right" :
        direction === "from-top" ? "animate-wipe-top" :
        "animate-wipe-bottom";
      
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} ${wipeClass}`} />
          <style jsx>{`
            @keyframes wipe-left {
              0% { clip-path: inset(0 100% 0 0); }
              50% { clip-path: inset(0 0 0 0); }
              100% { clip-path: inset(0 100% 0 0); }
            }
            @keyframes wipe-right {
              0% { clip-path: inset(0 0 0 100%); }
              50% { clip-path: inset(0 0 0 0); }
              100% { clip-path: inset(0 0 0 100%); }
            }
            @keyframes wipe-top {
              0% { clip-path: inset(0 0 100% 0); }
              50% { clip-path: inset(0 0 0 0); }
              100% { clip-path: inset(0 0 100% 0); }
            }
            @keyframes wipe-bottom {
              0% { clip-path: inset(100% 0 0 0); }
              50% { clip-path: inset(0 0 0 0); }
              100% { clip-path: inset(100% 0 0 0); }
            }
            .animate-wipe-left { animation: wipe-left 2s infinite; }
            .animate-wipe-right { animation: wipe-right 2s infinite; }
            .animate-wipe-top { animation: wipe-top 2s infinite; }
            .animate-wipe-bottom { animation: wipe-bottom 2s infinite; }
          `}</style>
        </div>
      );
      
    case "flip":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900 preserve-3d">
          <div className={`${box1Style} animate-flip-out`} />
          <div className={`${box2Style} animate-flip-in`} />
          <style jsx>{`
            .preserve-3d { transform-style: preserve-3d; perspective: 1000px; }
            @keyframes flip-out {
              0% { transform: rotateY(0deg); opacity: 1; }
              50% { transform: rotateY(90deg); opacity: 0; }
              100% { transform: rotateY(0deg); opacity: 1; }
            }
            @keyframes flip-in {
              0% { transform: rotateY(-90deg); opacity: 0; }
              50% { transform: rotateY(0deg); opacity: 1; }
              100% { transform: rotateY(-90deg); opacity: 0; }
            }
            .animate-flip-out { animation: flip-out 2s infinite; }
            .animate-flip-in { animation: flip-in 2s infinite; }
          `}</style>
        </div>
      );
      
    case "clockWipe":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-clock-wipe`} />
          <style jsx>{`
            @keyframes clock-wipe {
              0% { clip-path: polygon(50% 50%, 50% 0%, 50% 0%); }
              25% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%); }
              50% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%); }
              75% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%); }
              100% { clip-path: polygon(50% 50%, 50% 0%, 50% 0%); }
            }
            .animate-clock-wipe { animation: clock-wipe 2s infinite; }
          `}</style>
        </div>
      );
      
    case "star":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-star`} />
          <style jsx>{`
            @keyframes star {
              0% { 
                clip-path: polygon(50% 50%, 50% 50%, 50% 50%);
                transform: scale(0);
              }
              50% { 
                clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                transform: scale(1);
              }
              100% { 
                clip-path: polygon(50% 50%, 50% 50%, 50% 50%);
                transform: scale(0);
              }
            }
            .animate-star { animation: star 2s infinite; }
          `}</style>
        </div>
      );
      
    case "circle":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-circle`} />
          <style jsx>{`
            @keyframes circle {
              0% { clip-path: circle(0% at 50% 50%); }
              50% { clip-path: circle(50% at 50% 50%); }
              100% { clip-path: circle(0% at 50% 50%); }
            }
            .animate-circle { animation: circle 2s infinite; }
          `}</style>
        </div>
      );
      
    case "rectangle":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-rectangle`} />
          <style jsx>{`
            @keyframes rectangle {
              0% { transform: scale(0); }
              50% { transform: scale(1); }
              100% { transform: scale(0); }
            }
            .animate-rectangle { 
              animation: rectangle 2s infinite;
              transform-origin: center;
            }
          `}</style>
        </div>
      );
      
    case "zoom":
      const zoomClass = name === "zoom out" ? "animate-zoom-out" : "animate-zoom-in";
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} ${zoomClass}`} />
          <style jsx>{`
            @keyframes zoom-in {
              0% { transform: scale(1); opacity: 0; }
              50% { transform: scale(2); opacity: 1; }
              100% { transform: scale(1); opacity: 0; }
            }
            @keyframes zoom-out {
              0% { transform: scale(2); opacity: 0; }
              50% { transform: scale(1); opacity: 1; }
              100% { transform: scale(2); opacity: 0; }
            }
            .animate-zoom-in { animation: zoom-in 2s infinite; }
            .animate-zoom-out { animation: zoom-out 2s infinite; }
          `}</style>
        </div>
      );
      
    case "blur":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-blur`} />
          <style jsx>{`
            @keyframes blur {
              0% { filter: blur(10px); opacity: 0; }
              50% { filter: blur(0px); opacity: 1; }
              100% { filter: blur(10px); opacity: 0; }
            }
            .animate-blur { animation: blur 2s infinite; }
          `}</style>
        </div>
      );
      
    case "pixelate":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-pixelate`} />
          <style jsx>{`
            @keyframes pixelate {
              0% { filter: blur(4px); opacity: 0; }
              50% { filter: blur(0px); opacity: 1; }
              100% { filter: blur(4px); opacity: 0; }
            }
            .animate-pixelate { 
              animation: pixelate 2s infinite;
              image-rendering: pixelated;
            }
          `}</style>
        </div>
      );
      
    case "dissolve":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-dissolve`} />
          <style jsx>{`
            @keyframes dissolve {
              0% { opacity: 0; filter: contrast(0) brightness(2); }
              50% { opacity: 1; filter: contrast(1) brightness(1); }
              100% { opacity: 0; filter: contrast(0) brightness(2); }
            }
            .animate-dissolve { animation: dissolve 2s infinite; }
          `}</style>
        </div>
      );
      
    case "spin":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-spin-transition`} />
          <style jsx>{`
            @keyframes spin-transition {
              0% { transform: rotate(0deg) scale(1); opacity: 0; }
              50% { transform: rotate(180deg) scale(0.5); opacity: 1; }
              100% { transform: rotate(360deg) scale(1); opacity: 0; }
            }
            .animate-spin-transition { animation: spin-transition 2s infinite; }
          `}</style>
        </div>
      );
      
    case "squeeze":
      const squeezeClass = direction === "vertical" ? "animate-squeeze-v" : "animate-squeeze-h";
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} ${squeezeClass}`} />
          <style jsx>{`
            @keyframes squeeze-h {
              0% { transform: scaleX(1); }
              50% { transform: scaleX(0); }
              100% { transform: scaleX(1); }
            }
            @keyframes squeeze-v {
              0% { transform: scaleY(1); }
              50% { transform: scaleY(0); }
              100% { transform: scaleY(1); }
            }
            .animate-squeeze-h { animation: squeeze-h 2s infinite; }
            .animate-squeeze-v { animation: squeeze-v 2s infinite; }
          `}</style>
        </div>
      );
      
    case "rotate":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-rotate`} />
          <style jsx>{`
            @keyframes rotate {
              0% { transform: rotate(0deg); opacity: 0; }
              50% { transform: rotate(90deg); opacity: 1; }
              100% { transform: rotate(180deg); opacity: 0; }
            }
            .animate-rotate { animation: rotate 2s infinite; }
          `}</style>
        </div>
      );
      
    case "heart":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-heart`} />
          <style jsx>{`
            @keyframes heart {
              0% { 
                clip-path: circle(0% at 50% 50%);
                transform: scale(0);
              }
              50% { 
                clip-path: path('M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z');
                transform: scale(3);
              }
              100% { 
                clip-path: circle(0% at 50% 50%);
                transform: scale(0);
              }
            }
            .animate-heart { animation: heart 2s infinite; }
          `}</style>
        </div>
      );
      
    case "diamond":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-diamond`} />
          <style jsx>{`
            @keyframes diamond {
              0% { 
                clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%);
                transform: rotate(45deg) scale(0);
              }
              50% { 
                clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
                transform: rotate(45deg) scale(1);
              }
              100% { 
                clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%);
                transform: rotate(45deg) scale(0);
              }
            }
            .animate-diamond { animation: diamond 2s infinite; }
          `}</style>
        </div>
      );
      
    case "ripple":
      return (
        <div className="relative w-full h-full overflow-hidden bg-gray-900">
          <div className={box1Style} />
          <div className={`${box2Style} animate-ripple`} />
          <div className="absolute inset-0 animate-ripple-ring" />
          <style jsx>{`
            @keyframes ripple {
              0% { opacity: 0; }
              50% { opacity: 1; }
              100% { opacity: 0; }
            }
            @keyframes ripple-ring {
              0% { 
                box-shadow: 0 0 0 0 rgba(255,255,255,0.8);
              }
              100% { 
                box-shadow: 0 0 0 20px rgba(255,255,255,0);
              }
            }
            .animate-ripple { animation: ripple 2s infinite; }
            .animate-ripple-ring { 
              animation: ripple-ring 2s infinite;
              border-radius: 50%;
            }
          `}</style>
        </div>
      );
      
    default:
      return (
        <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 text-xs">{kind}</div>
        </div>
      );
  }
};