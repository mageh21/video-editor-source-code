import React from 'react';
import { X } from 'lucide-react';

interface AnimationShowcaseProps {
  onClose: () => void;
}

export const AnimationShowcase: React.FC<AnimationShowcaseProps> = ({ onClose }) => {
  const animations = {
    enter: [
      { name: 'Fade In', value: 'fade', description: 'Gradually appears' },
      { name: 'Slide from Left', value: 'slide-left', description: 'Slides in from left side' },
      { name: 'Slide from Right', value: 'slide-right', description: 'Slides in from right side' },
      { name: 'Slide from Bottom', value: 'slide-up', description: 'Slides up from bottom' },
      { name: 'Slide from Top', value: 'slide-down', description: 'Slides down from top' },
      { name: 'Zoom In', value: 'zoom-in', description: 'Grows from center' },
      { name: 'Zoom Out', value: 'zoom-out', description: 'Shrinks to normal size' },
      { name: 'Bounce In', value: 'bounce', description: 'Bouncy entrance' },
      { name: 'Flip In', value: 'flip', description: 'Flips into view' },
      { name: 'Rotate In', value: 'rotate', description: 'Spins into view' },
    ],
    exit: [
      { name: 'Fade Out', value: 'fade', description: 'Gradually disappears' },
      { name: 'Slide to Left', value: 'slide-left', description: 'Slides out to left' },
      { name: 'Slide to Right', value: 'slide-right', description: 'Slides out to right' },
      { name: 'Slide to Top', value: 'slide-up', description: 'Slides up and out' },
      { name: 'Slide to Bottom', value: 'slide-down', description: 'Slides down and out' },
      { name: 'Zoom Out', value: 'zoom-in', description: 'Grows and disappears' },
      { name: 'Zoom In', value: 'zoom-out', description: 'Shrinks to nothing' },
      { name: 'Bounce Out', value: 'bounce', description: 'Bouncy exit' },
      { name: 'Flip Out', value: 'flip', description: 'Flips out of view' },
      { name: 'Rotate Out', value: 'rotate', description: 'Spins out of view' },
    ],
    loop: [
      { name: 'Pulse', value: 'pulse', description: 'Gentle size pulsing', preview: '◉' },
      { name: 'Wiggle', value: 'wiggle', description: 'Subtle rotation wiggle', preview: '〰️' },
      { name: 'Float', value: 'float', description: 'Floating up and down', preview: '↕️' },
      { name: 'Spin', value: 'spin', description: 'Continuous rotation', preview: '🔄' },
      { name: 'Blink', value: 'blink', description: 'Opacity blinking', preview: '💡' },
      { name: 'Shake', value: 'shake', description: 'Horizontal shaking', preview: '↔️' },
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Text Animation Examples</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Enter Animations */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Enter Animations</h3>
          <div className="grid grid-cols-2 gap-4">
            {animations.enter.map((anim) => (
              <div
                key={anim.value}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{anim.name}</h4>
                  <code className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {anim.value}
                  </code>
                </div>
                <p className="text-sm text-gray-400">{anim.description}</p>
                <div className="mt-3 h-12 bg-gray-900 rounded flex items-center justify-center overflow-hidden">
                  <div className={`animation-demo-${anim.value} text-white font-bold`}>
                    SAMPLE
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exit Animations */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Exit Animations</h3>
          <p className="text-sm text-gray-400 mb-4">
            Exit animations play at the end of the text's timeline
          </p>
        </div>

        {/* Loop Animations */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Loop Animations</h3>
          <div className="grid grid-cols-2 gap-4">
            {animations.loop.map((anim) => (
              <div
                key={anim.value}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">
                    {anim.preview} {anim.name}
                  </h4>
                  <code className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {anim.value}
                  </code>
                </div>
                <p className="text-sm text-gray-400">{anim.description}</p>
                <div className="mt-3 h-12 bg-gray-900 rounded flex items-center justify-center">
                  <div className={`animation-loop-${anim.value} text-white font-bold`}>
                    LOOP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium text-white mb-2">💡 Usage Tips</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Combine enter + exit animations for smooth transitions</li>
            <li>• Use loop animations sparingly to avoid distraction</li>
            <li>• Adjust duration (0.1-5s) to control animation speed</li>
            <li>• Loop speed multiplier: 0.5 = slower, 2 = faster</li>
            <li>• Preview button shows animations in the actual player</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        /* Enter animation demos */
        .animation-demo-fade {
          animation: fadeIn 1s ease-out infinite;
        }
        .animation-demo-slide-left {
          animation: slideLeft 1s ease-out infinite;
        }
        .animation-demo-slide-right {
          animation: slideRight 1s ease-out infinite;
        }
        .animation-demo-slide-up {
          animation: slideUp 1s ease-out infinite;
        }
        .animation-demo-slide-down {
          animation: slideDown 1s ease-out infinite;
        }
        .animation-demo-zoom-in {
          animation: zoomIn 1s ease-out infinite;
        }
        .animation-demo-zoom-out {
          animation: zoomOut 1s ease-out infinite;
        }
        .animation-demo-bounce {
          animation: bounceIn 1s ease-out infinite;
        }
        .animation-demo-flip {
          animation: flipIn 1s ease-out infinite;
        }
        .animation-demo-rotate {
          animation: rotateIn 1s ease-out infinite;
        }

        /* Loop animation demos */
        .animation-loop-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        .animation-loop-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }
        .animation-loop-float {
          animation: float 3s ease-in-out infinite;
        }
        .animation-loop-spin {
          animation: spin 3s linear infinite;
        }
        .animation-loop-blink {
          animation: blink 1s ease-in-out infinite;
        }
        .animation-loop-shake {
          animation: shake 0.5s ease-in-out infinite;
        }

        /* Keyframes */
        @keyframes fadeIn {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes slideLeft {
          0% { transform: translateX(-50px); opacity: 0; }
          50% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-50px); opacity: 0; }
        }
        @keyframes slideRight {
          0% { transform: translateX(50px); opacity: 0; }
          50% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(50px); opacity: 0; }
        }
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          50% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        @keyframes slideDown {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes zoomIn {
          0% { transform: scale(0); }
          50% { transform: scale(1); }
          100% { transform: scale(0); }
        }
        @keyframes zoomOut {
          0% { transform: scale(1.5); }
          50% { transform: scale(1); }
          100% { transform: scale(1.5); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); }
          25% { transform: scale(1.1); }
          50% { transform: scale(0.9); }
          75% { transform: scale(1); }
          100% { transform: scale(0); }
        }
        @keyframes flipIn {
          0% { transform: rotateY(90deg); }
          50% { transform: rotateY(0); }
          100% { transform: rotateY(90deg); }
        }
        @keyframes rotateIn {
          0% { transform: rotate(0); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};