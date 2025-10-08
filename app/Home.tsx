"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import FullScreenLoader from "./components/common/FullScreenLoader";
import { useNavigationLoader } from "./hooks/useNavigationLoader";

// Dynamic import to avoid SSR issues
const AnimatedDemo = dynamic(() => import('./components/homepage/SimpleAnimatedDemo'), {
  ssr: false,
  loading: () => (
    <div className="mt-16 relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg blur opacity-25"></div>
      <div className="relative bg-gray-900 rounded-lg p-1">
        <div className="bg-black rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-4 text-sm text-gray-500">Klippy Editor - Loading Demo...</span>
          </div>
          <div className="bg-gray-900 rounded p-4 min-h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-t-white border-r-white border-opacity-30 border-t-opacity-100 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading demo...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  const { isNavigating, handleNavigation } = useNavigationLoader();

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section with Enhanced Design */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 to-black pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter">
              KLIPPY
            </h1>
            <div className="h-1 w-32 bg-white mx-auto mt-4"></div>
          </div>

          {/* Tagline */}
          <p className="text-3xl sm:text-4xl lg:text-5xl font-light mb-6 leading-tight">
            Professional Video Editing
            <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2 text-gray-400">
              Right in Your Browser
            </span>
          </p>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            No downloads. No uploads. No limits. Edit videos with a powerful timeline, 
            add effects, transitions, and export in high quality - all locally in your browser.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/projects"
              onClick={(event) => {
                handleNavigation(event, "/projects");
              }}
              className="group relative inline-flex items-center justify-center bg-white text-black font-bold text-lg px-10 py-5 rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              <span className="mr-2">Start Editing</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <button 
              className="text-gray-400 hover:text-white font-medium text-lg px-8 py-4 border border-gray-700 rounded-full hover:border-gray-500 transition-all duration-300"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See Features
            </button>
          </div>

          {/* Editor Demo Animation */}
          <div className="mt-16">
            <AnimatedDemo />
          </div>
        </div>
      </section>

      {/* Features Section with Icons */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
            Professional video editing features without the complexity or cost
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Multi-Track Timeline</h3>
              <p className="text-gray-400 leading-relaxed">
                Professional timeline with unlimited tracks for video, audio, text, and effects. 
                Precise editing with frame-level accuracy.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Real-Time Preview</h3>
              <p className="text-gray-400 leading-relaxed">
                Instant playback of your edits. See changes immediately without rendering. 
                Smooth performance even with complex projects.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">100% Browser-Based</h3>
              <p className="text-gray-400 leading-relaxed">
                No installation required. Works in any modern desktop browser. 
                Your files never leave your computer.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Effects & Transitions</h3>
              <p className="text-gray-400 leading-relaxed">
                Professional transitions between clips. Text animations, filters, and effects. 
                Customize every aspect of your video.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">High-Quality Export</h3>
              <p className="text-gray-400 leading-relaxed">
                Export up to 1080p with FFmpeg. Multiple formats including MP4 and WebM. 
                No watermarks, ever.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Forever Free</h3>
              <p className="text-gray-400 leading-relaxed">
                No subscriptions, no trials, no limits. Open source and community-driven. 
                Use it as much as you want.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
            How It Works
          </h2>
          
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center font-bold text-2xl">
                  1
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Create a Project</h3>
                <p className="text-gray-400 text-lg">
                  Choose your screen size - from YouTube to TikTok formats. Name your project and you're ready to go.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center font-bold text-2xl">
                  2
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Import Your Media</h3>
                <p className="text-gray-400 text-lg">
                  Drag and drop videos, images, and audio files. Everything is processed locally - your files never leave your device.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center font-bold text-2xl">
                  3
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Edit on Timeline</h3>
                <p className="text-gray-400 text-lg">
                  Arrange clips, add text, apply transitions. Use keyboard shortcuts for fast editing. Preview in real-time.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center font-bold text-2xl">
                  4
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Export & Share</h3>
                <p className="text-gray-400 text-lg">
                  Render your video in high quality. Download directly to your device. No watermarks, no account needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of creators editing videos right in their browser.
          </p>
          <Link
            href="/projects"
            onClick={(event) => {
              handleNavigation(event, "/projects");
            }}
            className="inline-flex items-center justify-center bg-white text-black font-bold text-xl px-12 py-6 rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            Start Editing Now
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
      {isNavigating && <FullScreenLoader message="Opening projects" subtle />}
    </main>
  );
}
