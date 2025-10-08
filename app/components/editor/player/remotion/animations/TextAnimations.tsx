import { interpolate, useCurrentFrame, useVideoConfig, spring, interpolateColors } from 'remotion';
import { TextElement } from '@/app/types';

interface TextAnimationProps {
  item: TextElement;
  children: React.ReactNode;
  sequenceFrom: number;
  sequenceDuration: number;
}

export const TextAnimations: React.FC<TextAnimationProps> = ({
  item,
  children,
  sequenceFrom,
  sequenceDuration
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Calculate relative frame within the sequence
  const relativeFrame = frame - sequenceFrom;
  
  // Animation durations
  const inDuration = (item.animationInDuration || 0.5) * fps;
  const outDuration = (item.animationOutDuration || 0.5) * fps;
  const outStartFrame = sequenceDuration - outDuration;
  
  // Initialize transform values
  let translateX = 0;
  let translateY = 0;
  let scale = 1;
  let rotate = 0;
  let opacity = 1;
  let blur = 0;
  
  // Apply enter animation
  if (item.animationIn && item.animationIn !== 'none' && relativeFrame < inDuration) {
    const progress = interpolate(relativeFrame, [0, inDuration], [0, 1], {
      extrapolateRight: 'clamp',
    });
    
    switch (item.animationIn) {
      case 'fade':
        opacity = progress;
        break;
        
      case 'slide-left':
        translateX = interpolate(progress, [0, 1], [-100, 0]);
        break;
        
      case 'slide-right':
        translateX = interpolate(progress, [0, 1], [100, 0]);
        break;
        
      case 'slide-up':
        translateY = interpolate(progress, [0, 1], [100, 0]);
        break;
        
      case 'slide-down':
        translateY = interpolate(progress, [0, 1], [-100, 0]);
        break;
        
      case 'zoom-in':
        scale = interpolate(progress, [0, 1], [0, 1]);
        break;
        
      case 'zoom-out':
        scale = interpolate(progress, [0, 1], [2, 1]);
        break;
        
      case 'bounce':
        const bounce = spring({
          frame: relativeFrame,
          fps,
          config: {
            damping: 10,
            stiffness: 200,
          },
        });
        scale = bounce;
        break;
        
      case 'flip':
        rotate = interpolate(progress, [0, 1], [180, 0]);
        break;
        
      case 'rotate':
        rotate = interpolate(progress, [0, 1], [360, 0]);
        break;
    }
  }
  
  // Apply exit animation
  if (item.animationOut && item.animationOut !== 'none' && relativeFrame >= outStartFrame) {
    const outProgress = interpolate(
      relativeFrame,
      [outStartFrame, sequenceDuration],
      [0, 1],
      { extrapolateRight: 'clamp' }
    );
    
    switch (item.animationOut) {
      case 'fade':
        opacity = 1 - outProgress;
        break;
        
      case 'slide-left':
        translateX = interpolate(outProgress, [0, 1], [0, -100]);
        break;
        
      case 'slide-right':
        translateX = interpolate(outProgress, [0, 1], [0, 100]);
        break;
        
      case 'slide-up':
        translateY = interpolate(outProgress, [0, 1], [0, -100]);
        break;
        
      case 'slide-down':
        translateY = interpolate(outProgress, [0, 1], [0, 100]);
        break;
        
      case 'zoom-in':
        scale = interpolate(outProgress, [0, 1], [1, 2]);
        break;
        
      case 'zoom-out':
        scale = interpolate(outProgress, [0, 1], [1, 0]);
        break;
        
      case 'bounce':
        const bounceOut = spring({
          frame: relativeFrame - outStartFrame,
          fps,
          config: {
            damping: 10,
            stiffness: 200,
          },
        });
        scale = 1 + (1 - bounceOut) * 0.5;
        break;
        
      case 'flip':
        rotate = interpolate(outProgress, [0, 1], [0, -180]);
        break;
        
      case 'rotate':
        rotate = interpolate(outProgress, [0, 1], [0, -360]);
        break;
    }
  }
  
  // Apply loop animation
  let loopTransform = '';
  let loopFilter = '';
  
  if (item.animationLoop && item.animationLoop !== 'none') {
    const loopSpeed = item.animationLoopSpeed || 1;
    const loopProgress = (relativeFrame * loopSpeed) / fps;
    
    switch (item.animationLoop) {
      case 'pulse':
        const pulseScale = 1 + Math.sin(loopProgress * Math.PI * 2) * 0.1;
        loopTransform = `scale(${pulseScale})`;
        break;
        
      case 'wiggle':
        const wiggleRotate = Math.sin(loopProgress * Math.PI * 4) * 5;
        loopTransform = `rotate(${wiggleRotate}deg)`;
        break;
        
      case 'float':
        const floatY = Math.sin(loopProgress * Math.PI * 2) * 10;
        loopTransform = `translateY(${floatY}px)`;
        break;
        
      case 'spin':
        const spinRotate = (loopProgress * 360) % 360;
        loopTransform = `rotate(${spinRotate}deg)`;
        break;
        
      case 'blink':
        const blinkOpacity = Math.sin(loopProgress * Math.PI * 4) > 0 ? 1 : 0.3;
        opacity *= blinkOpacity;
        break;
        
      case 'shake':
        const shakeX = Math.sin(loopProgress * Math.PI * 20) * 2;
        loopTransform = `translateX(${shakeX}px)`;
        break;
        
    }
  }
  
  // Combine all transforms
  const transform = `
    translate(${translateX}%, ${translateY}%)
    scale(${scale})
    rotate(${rotate}deg)
    ${loopTransform}
  `;
  
  return (
    <div
      style={{
        transform,
        opacity: opacity * ((item.opacity || 100) / 100),
        filter: blur ? `blur(${blur}px) ${loopFilter}` : loopFilter,
        transformOrigin: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
};