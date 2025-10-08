export type TransitionStyle = {
  transform?: string;
  opacity?: number;
  filter?: string;
  clipPath?: string;
};

export type TransitionTemplate = {
  name: string;
  preview: string;
  enter: (progress: number) => TransitionStyle;
  exit: (progress: number) => TransitionStyle;
};

// Easing functions
const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

const easeOut = (t: number): number => {
  return 1 - (1 - t) * (1 - t);
};

const easeIn = (t: number): number => {
  return t * t;
};

const bounceOut = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

export const transitionTemplates: Record<string, TransitionTemplate> = {
  fade: {
    name: "Fade",
    preview: "Simple fade in/out",
    enter: (progress) => ({
      opacity: progress,
    }),
    exit: (progress) => ({
      opacity: 1 - progress,
    }),
  },
  slideLeft: {
    name: "Left",
    preview: "Slide in from right",
    enter: (progress) => ({
      transform: `translateX(${(1 - progress) * 100}%)`,
      opacity: progress,
    }),
    exit: (progress) => ({
      transform: `translateX(${-progress * 100}%)`,
      opacity: 1 - progress,
    }),
  },
  slideRight: {
    name: "Right",
    preview: "Slide in from left",
    enter: (progress) => ({
      transform: `translateX(${(1 - progress) * -100}%)`,
      opacity: progress,
    }),
    exit: (progress) => ({
      transform: `translateX(${progress * 100}%)`,
      opacity: 1 - progress,
    }),
  },
  slideUp: {
    name: "Up",
    preview: "Slide in from bottom",
    enter: (progress) => ({
      transform: `translateY(${(1 - easeOut(progress)) * 30}px)`,
      opacity: progress,
    }),
    exit: (progress) => ({
      transform: `translateY(${-easeOut(progress) * 30}px)`,
      opacity: 1 - progress,
    }),
  },
  slideDown: {
    name: "Down",
    preview: "Slide in from top",
    enter: (progress) => ({
      transform: `translateY(${(1 - easeOut(progress)) * -30}px)`,
      opacity: progress,
    }),
    exit: (progress) => ({
      transform: `translateY(${easeOut(progress) * 30}px)`,
      opacity: 1 - progress,
    }),
  },
  scale: {
    name: "Scale",
    preview: "Scale in/out",
    enter: (progress) => ({
      transform: `scale(${easeOut(progress)})`,
      opacity: progress,
    }),
    exit: (progress) => ({
      transform: `scale(${1 - easeOut(progress) * 0.5})`,
      opacity: 1 - progress,
    }),
  },
  zoomBlur: {
    name: "Zoom Blur",
    preview: "Zoom with blur effect",
    enter: (progress) => ({
      transform: `scale(${1.5 - easeOut(progress) * 0.5})`,
      opacity: progress,
      filter: `blur(${(1 - progress) * 10}px)`,
    }),
    exit: (progress) => ({
      transform: `scale(${1 + easeOut(progress) * 0.5})`,
      opacity: 1 - progress,
      filter: `blur(${progress * 10}px)`,
    }),
  },
  bounce: {
    name: "Bounce",
    preview: "Elastic bounce entrance",
    enter: (progress) => {
      const bounce = bounceOut(progress);
      return {
        transform: `translateY(${(1 - bounce) * 100}px)`,
        opacity: Math.min(progress * 2, 1),
      };
    },
    exit: (progress) => {
      const bounce = bounceOut(1 - progress);
      return {
        transform: `translateY(${(1 - bounce) * -100}px)`,
        opacity: 1 - progress,
      };
    },
  },
  flipX: {
    name: "Flip H",
    preview: "3D flip around X axis",
    enter: (progress) => ({
      transform: `perspective(400px) rotateX(${(1 - easeInOut(progress)) * 90}deg)`,
      opacity: progress > 0.5 ? 1 : progress * 2,
    }),
    exit: (progress) => ({
      transform: `perspective(400px) rotateX(${-easeInOut(progress) * 90}deg)`,
      opacity: progress < 0.5 ? 1 : (1 - progress) * 2,
    }),
  },
  rotate: {
    name: "Rotate",
    preview: "Rotate with scale",
    enter: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `rotate(${(1 - eased) * -180}deg) scale(${eased})`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `rotate(${eased * 180}deg) scale(${1 - eased * 0.5})`,
        opacity: 1 - progress,
      };
    },
  },
  glitch: {
    name: "Glitch",
    preview: "Digital glitch effect",
    enter: (progress) => {
      const glitchX = Math.sin(progress * 20) * (1 - progress) * 5;
      const glitchY = Math.cos(progress * 15) * (1 - progress) * 3;
      return {
        transform: `translate(${glitchX}px, ${glitchY}px) scale(${0.9 + progress * 0.1})`,
        opacity: progress > 0.2 ? 1 : progress * 5,
      };
    },
    exit: (progress) => {
      const glitchX = Math.sin((1 - progress) * 20) * progress * 5;
      const glitchY = Math.cos((1 - progress) * 15) * progress * 3;
      return {
        transform: `translate(${glitchX}px, ${glitchY}px) scale(${1 - progress * 0.1})`,
        opacity: progress < 0.8 ? 1 : (1 - progress) * 5,
      };
    },
  },
  swipeReveal: {
    name: "Swipe",
    preview: "Reveals content with a swipe",
    enter: (progress) => ({
      opacity: 1,
      clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
    }),
    exit: (progress) => ({
      opacity: 1,
      clipPath: `inset(0 0 0 ${progress * 100}%)`,
    }),
  },
  wave: {
    name: "Wave",
    preview: "Wavy motion entrance",
    enter: (progress) => {
      const wave = Math.sin(progress * Math.PI * 2) * 20 * (1 - progress);
      return {
        transform: `translateX(${wave}px) translateY(${(1 - progress) * 50}px)`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const wave = Math.sin((1 - progress) * Math.PI * 2) * 20 * progress;
      return {
        transform: `translateX(${wave}px) translateY(${-progress * 50}px)`,
        opacity: 1 - progress,
      };
    },
  },
  morph: {
    name: "Morph",
    preview: "Morphs from distorted shape",
    enter: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `skewX(${(1 - eased) * 30}deg) skewY(${(1 - eased) * -20}deg) scale(${0.8 + eased * 0.2})`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `skewX(${-eased * 30}deg) skewY(${eased * 20}deg) scale(${1 - eased * 0.2})`,
        opacity: 1 - progress,
      };
    },
  },
  
  // New transitions
  dissolve: {
    name: "Dissolve",
    preview: "Smooth dissolve effect",
    enter: (progress) => ({
      opacity: easeInOut(progress),
      filter: `contrast(${0.5 + easeInOut(progress) * 0.5})`,
    }),
    exit: (progress) => ({
      opacity: 1 - easeInOut(progress),
      filter: `contrast(${1 - easeInOut(progress) * 0.5})`,
    }),
  },
  
  wipeLeft: {
    name: "Wipe Left",
    preview: "Wipe from right to left",
    enter: (progress) => ({
      clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
    }),
    exit: (progress) => ({
      clipPath: `inset(0 0 0 ${progress * 100}%)`,
    }),
  },
  
  wipeRight: {
    name: "Wipe Right",
    preview: "Wipe from left to right",
    enter: (progress) => ({
      clipPath: `inset(0 0 0 ${(1 - progress) * 100}%)`,
    }),
    exit: (progress) => ({
      clipPath: `inset(0 ${progress * 100}% 0 0)`,
    }),
  },
  
  wipeUp: {
    name: "Wipe Up",
    preview: "Wipe from bottom to top",
    enter: (progress) => ({
      clipPath: `inset(${(1 - progress) * 100}% 0 0 0)`,
    }),
    exit: (progress) => ({
      clipPath: `inset(0 0 ${progress * 100}% 0)`,
    }),
  },
  
  wipeDown: {
    name: "Wipe Down",
    preview: "Wipe from top to bottom",
    enter: (progress) => ({
      clipPath: `inset(0 0 ${(1 - progress) * 100}% 0)`,
    }),
    exit: (progress) => ({
      clipPath: `inset(${progress * 100}% 0 0 0)`,
    }),
  },
  
  circleReveal: {
    name: "Circle",
    preview: "Circular reveal from center",
    enter: (progress) => ({
      clipPath: `circle(${progress * 150}% at 50% 50%)`,
    }),
    exit: (progress) => ({
      clipPath: `circle(${(1 - progress) * 150}% at 50% 50%)`,
    }),
  },
  
  diamondReveal: {
    name: "Diamond",
    preview: "Diamond shape reveal",
    enter: (progress) => {
      const size = progress * 150;
      return {
        clipPath: `polygon(50% ${50 - size}%, ${50 + size}% 50%, 50% ${50 + size}%, ${50 - size}% 50%)`,
      };
    },
    exit: (progress) => {
      const size = (1 - progress) * 150;
      return {
        clipPath: `polygon(50% ${50 - size}%, ${50 + size}% 50%, 50% ${50 + size}%, ${50 - size}% 50%)`,
      };
    },
  },
  
  flipY: {
    name: "Flip V",
    preview: "3D flip around Y axis",
    enter: (progress) => ({
      transform: `perspective(400px) rotateY(${(1 - easeInOut(progress)) * -90}deg)`,
      opacity: progress > 0.5 ? 1 : progress * 2,
    }),
    exit: (progress) => ({
      transform: `perspective(400px) rotateY(${easeInOut(progress) * 90}deg)`,
      opacity: progress < 0.5 ? 1 : (1 - progress) * 2,
    }),
  },
  
  spin: {
    name: "Spin",
    preview: "Spinning entrance/exit",
    enter: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `rotate(${(1 - eased) * 360}deg) scale(${eased})`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `rotate(${-eased * 360}deg) scale(${1 - eased})`,
        opacity: 1 - progress,
      };
    },
  },
  
  elastic: {
    name: "Elastic",
    preview: "Elastic bounce effect",
    enter: (progress) => {
      const elasticOut = (t: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
          ? 0
          : t === 1
          ? 1
          : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      };
      const scale = elasticOut(progress);
      return {
        transform: `scale(${scale})`,
        opacity: Math.min(progress * 2, 1),
      };
    },
    exit: (progress) => {
      const elasticIn = (t: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
          ? 0
          : t === 1
          ? 1
          : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
      };
      return {
        transform: `scale(${1 + elasticIn(progress) * 0.5})`,
        opacity: 1 - progress,
      };
    },
  },
  
  spiral: {
    name: "Spiral",
    preview: "Spiral in/out effect",
    enter: (progress) => {
      const angle = (1 - progress) * 720;
      const scale = easeOut(progress);
      const distance = (1 - progress) * 100;
      return {
        transform: `rotate(${angle}deg) scale(${scale}) translate(${distance}px, 0)`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const angle = progress * 720;
      const scale = 1 - easeOut(progress) * 0.5;
      const distance = progress * 100;
      return {
        transform: `rotate(${-angle}deg) scale(${scale}) translate(${distance}px, 0)`,
        opacity: 1 - progress,
      };
    },
  },
  
  unfold: {
    name: "Unfold",
    preview: "Unfold from center",
    enter: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `scaleX(${eased}) scaleY(${Math.pow(eased, 2)})`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `scaleX(${1 - eased * 0.5}) scaleY(${Math.pow(1 - eased, 2)})`,
        opacity: 1 - progress,
      };
    },
  },
  
  curtain: {
    name: "Curtain",
    preview: "Curtain opening effect",
    enter: (progress) => ({
      clipPath: `polygon(${50 - progress * 50}% 0%, ${50 + progress * 50}% 0%, ${50 + progress * 50}% 100%, ${50 - progress * 50}% 100%)`,
    }),
    exit: (progress) => ({
      clipPath: `polygon(${progress * 50}% 0%, ${100 - progress * 50}% 0%, ${100 - progress * 50}% 100%, ${progress * 50}% 100%)`,
    }),
  },
  
  iris: {
    name: "Iris",
    preview: "Camera iris effect",
    enter: (progress) => {
      const eased = easeInOut(progress);
      const points = 6;
      const angle = Math.PI * 2 / points;
      const radius = eased * 100;
      
      let path = '';
      for (let i = 0; i < points; i++) {
        const x = 50 + radius * Math.cos(i * angle - Math.PI / 2);
        const y = 50 + radius * Math.sin(i * angle - Math.PI / 2);
        path += `${x}% ${y}%${i < points - 1 ? ', ' : ''}`;
      }
      
      return {
        clipPath: `polygon(${path})`,
      };
    },
    exit: (progress) => {
      const eased = easeInOut(1 - progress);
      const points = 6;
      const angle = Math.PI * 2 / points;
      const radius = eased * 100;
      
      let path = '';
      for (let i = 0; i < points; i++) {
        const x = 50 + radius * Math.cos(i * angle - Math.PI / 2);
        const y = 50 + radius * Math.sin(i * angle - Math.PI / 2);
        path += `${x}% ${y}%${i < points - 1 ? ', ' : ''}`;
      }
      
      return {
        clipPath: `polygon(${path})`,
      };
    },
  },
  
  pixelate: {
    name: "Pixelate",
    preview: "Pixelation effect",
    enter: (progress) => {
      const blur = (1 - progress) * 5;
      return {
        filter: `blur(${blur}px) contrast(${0.5 + progress * 0.5})`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const blur = progress * 5;
      return {
        filter: `blur(${blur}px) contrast(${1 - progress * 0.5})`,
        opacity: 1 - progress,
      };
    },
  },
  
  heartbeat: {
    name: "Heartbeat",
    preview: "Pulsing heartbeat effect",
    enter: (progress) => {
      const beat = Math.sin(progress * Math.PI * 4) * 0.1 + 1;
      return {
        transform: `scale(${progress * beat})`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const beat = Math.sin((1 - progress) * Math.PI * 4) * 0.1 + 1;
      return {
        transform: `scale(${(1 - progress) * beat})`,
        opacity: 1 - progress,
      };
    },
  },
  
  squeeze: {
    name: "Squeeze",
    preview: "Squeeze in/out",
    enter: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `scaleX(${0.3 + eased * 0.7}) scaleY(${1 + (1 - eased) * 0.5})`,
        opacity: progress,
      };
    },
    exit: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `scaleX(${1 - eased * 0.7}) scaleY(${1 + eased * 0.5})`,
        opacity: 1 - progress,
      };
    },
  },
  
  doorway: {
    name: "Doorway",
    preview: "Opening doorway effect",
    enter: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `perspective(1000px) rotateY(${(1 - eased) * 45}deg)`,
        transformOrigin: 'left center',
        opacity: progress,
      };
    },
    exit: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `perspective(1000px) rotateY(${-eased * 45}deg)`,
        transformOrigin: 'right center',
        opacity: 1 - progress,
      };
    },
  },
  
  tv: {
    name: "TV Off",
    preview: "Old TV turning off effect",
    enter: (progress) => {
      const eased = easeOut(progress);
      return {
        transform: `scaleY(${eased}) scaleX(${0.8 + eased * 0.2})`,
        opacity: progress,
        filter: `brightness(${0.5 + eased * 0.5})`,
      };
    },
    exit: (progress) => {
      const eased = easeIn(progress);
      return {
        transform: `scaleY(${1 - eased}) scaleX(${1 - eased * 0.2})`,
        opacity: 1 - progress,
        filter: `brightness(${1 - eased * 0.5})`,
      };
    },
  },
};