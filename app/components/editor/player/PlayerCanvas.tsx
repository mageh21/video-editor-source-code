"use client"

import { useRef } from 'react';
import Scene from "./Scene";
import { PlayerRef } from "@remotion/player";

export default function PlayerCanvas() {
  const playerRef = useRef<PlayerRef>(null);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Scene playerRef={playerRef} />
    </div>
  );
}