import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { useRef, useState, useEffect } from "react";
import { setIsPlaying } from "@/app/store/slices/projectSlice";
import { useDispatch } from "react-redux";
import React from "react";

const fps = 30;

export const PreviewPlayer = React.forwardRef<PlayerRef>((props, ref) => {
    const projectState = useAppSelector((state) => state.projectState);
    const { duration, currentTime, isPlaying, isMuted, resolution } = projectState;
    const playerRef = useRef<PlayerRef>(null);
    const dispatch = useDispatch();
    
    // Expose ref
    React.useImperativeHandle(ref, () => playerRef.current!);

    // update frame when current time with marker
    useEffect(() => {
        const frame = Math.round(currentTime * fps);
        if (playerRef.current && !isPlaying) {
            playerRef.current.pause();
            playerRef.current.seekTo(frame);
        }
    }, [currentTime, fps]);

    useEffect(() => {
        playerRef?.current?.addEventListener("play", () => {
            dispatch(setIsPlaying(true));
        });
        playerRef?.current?.addEventListener("pause", () => {
            dispatch(setIsPlaying(false));
        });
        return () => {
            playerRef?.current?.removeEventListener("play", () => {
                dispatch(setIsPlaying(true));
            });
            playerRef?.current?.removeEventListener("pause", () => {
                dispatch(setIsPlaying(false));
            });
        };
    }, [playerRef]);

    // to control with keyboard
    useEffect(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.mute();
        } else {
            playerRef.current.unmute();
        }
    }, [isMuted]);

    // Ensure duration is a valid finite number
    const safeDuration = isFinite(duration) && duration > 0 ? duration : 30;
    const durationInFrames = Math.max(1, Math.floor(safeDuration * fps) + 1);

    return (
        <Player
            ref={playerRef}
            component={Composition}
            inputProps={{}}
            durationInFrames={durationInFrames}
            compositionWidth={resolution.width}
            compositionHeight={resolution.height}
            fps={fps}
            className="w-full h-full"
            style={{ 
                backgroundColor: "transparent"
            }}
            controls={false}
            acknowledgeRemotionLicense
            showVolumeControls={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            showPosterWhenUnplayed={false}
            showPosterWhenPaused={false}
            showPosterWhenEnded={false}
        />
    )
});

PreviewPlayer.displayName = 'PreviewPlayer';