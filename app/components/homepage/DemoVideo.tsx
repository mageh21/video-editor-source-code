'use client';

import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const DemoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Scene durations in frames
  const scene1Duration = fps * 3; // 3 seconds
  const scene2Duration = fps * 3;
  const scene3Duration = fps * 3;
  const scene4Duration = fps * 3;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Scene 1: Logo Animation */}
      <Sequence from={0} durationInFrames={scene1Duration}>
        <LogoScene />
      </Sequence>

      {/* Scene 2: Timeline Demo */}
      <Sequence from={scene1Duration} durationInFrames={scene2Duration}>
        <TimelineScene />
      </Sequence>

      {/* Scene 3: Features Showcase */}
      <Sequence from={scene1Duration + scene2Duration} durationInFrames={scene3Duration}>
        <FeaturesScene />
      </Sequence>

      {/* Scene 4: Call to Action */}
      <Sequence from={scene1Duration + scene2Duration + scene3Duration} durationInFrames={scene4Duration}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Scene 1: Animated Logo
const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: {
      damping: 10,
      stiffness: 100,
    },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        <h1 style={{ 
          fontSize: 120, 
          fontWeight: 900, 
          color: '#fff',
          letterSpacing: '-0.05em',
          marginBottom: 20,
        }}>
          KLIPPY
        </h1>
        <div style={{
          height: 4,
          width: 200,
          backgroundColor: '#fff',
          margin: '0 auto',
          opacity: interpolate(frame, [20, 40], [0, 1]),
        }} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Timeline Animation
const TimelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  
  const timelineProgress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ padding: 40 }}>
      <div style={{ 
        fontSize: 40, 
        fontWeight: 700, 
        color: '#fff',
        marginBottom: 40,
        opacity: interpolate(frame, [0, 20], [0, 1]),
      }}>
        Multi-Track Timeline Editor
      </div>
      
      {/* Timeline Tracks */}
      <div style={{ position: 'relative', height: 400 }}>
        {['Video', 'Audio', 'Text', 'Effects'].map((label, index) => (
          <TimelineTrack 
            key={label}
            label={label}
            index={index}
            progress={timelineProgress}
            frame={frame}
          />
        ))}
        
        {/* Playhead */}
        <div style={{
          position: 'absolute',
          left: `${timelineProgress * 80}%`,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: '#ff0000',
          transition: 'none',
        }} />
      </div>
    </AbsoluteFill>
  );
};

const TimelineTrack: React.FC<{ label: string; index: number; progress: number; frame: number }> = ({ 
  label, 
  index, 
  progress,
  frame 
}) => {
  const opacity = interpolate(frame, [index * 10, index * 10 + 20], [0, 1]);
  
  return (
    <div style={{ 
      marginBottom: 20,
      opacity,
    }}>
      <div style={{ 
        color: '#888', 
        fontSize: 14, 
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ 
        height: 60, 
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Track Items */}
        {index === 0 && (
          <div style={{
            position: 'absolute',
            left: '10%',
            width: `${progress * 30}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4a90e2, #357abd)',
            borderRadius: 4,
          }} />
        )}
        {index === 1 && (
          <div style={{
            position: 'absolute',
            left: '20%',
            width: `${progress * 40}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #50c878, #3d9e5f)',
            borderRadius: 4,
          }} />
        )}
        {index === 2 && progress > 0.5 && (
          <div style={{
            position: 'absolute',
            left: '50%',
            width: '20%',
            height: '100%',
            background: 'linear-gradient(90deg, #ff6b6b, #cc5656)',
            borderRadius: 4,
            opacity: interpolate(frame, [40, 50], [0, 1]),
          }} />
        )}
      </div>
    </div>
  );
};

// Scene 3: Features Grid
const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const features = [
    { icon: '🎬', title: 'Real-time Preview' },
    { icon: '✂️', title: 'Precise Editing' },
    { icon: '🎨', title: 'Effects & Filters' },
    { icon: '📱', title: 'Any Device' },
  ];

  return (
    <AbsoluteFill style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ 
        fontSize: 48, 
        fontWeight: 700, 
        color: '#fff',
        marginBottom: 60,
        opacity: interpolate(frame, [0, 20], [0, 1]),
      }}>
        Professional Features
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 40,
        maxWidth: 600,
      }}>
        {features.map((feature, index) => {
          const scale = spring({
            frame: frame - index * 10,
            fps: 30,
            from: 0,
            to: 1,
            config: {
              damping: 10,
              stiffness: 100,
            },
          });
          
          return (
            <div
              key={feature.title}
              style={{
                transform: `scale(${scale})`,
                backgroundColor: '#1a1a1a',
                borderRadius: 16,
                padding: 30,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 10 }}>{feature.icon}</div>
              <div style={{ color: '#fff', fontSize: 18 }}>{feature.title}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Call to Action
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const scale = spring({
    frame,
    fps: 30,
    from: 0.8,
    to: 1,
    config: {
      damping: 10,
      stiffness: 100,
    },
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: 56, 
          fontWeight: 700, 
          color: '#fff',
          marginBottom: 30,
          opacity: interpolate(frame, [0, 20], [0, 1]),
        }}>
          Start Editing Now
        </h2>
        <div
          style={{
            transform: `scale(${scale})`,
            display: 'inline-block',
            backgroundColor: '#fff',
            color: '#000',
            padding: '20px 50px',
            borderRadius: 50,
            fontSize: 24,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          It's Free →
        </div>
        <p style={{
          color: '#888',
          fontSize: 18,
          marginTop: 30,
          opacity: interpolate(frame, [30, 50], [0, 1]),
        }}>
          No downloads. No account. No limits.
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default DemoVideo;