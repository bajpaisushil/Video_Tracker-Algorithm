"use client";

import { useEffect, useRef, useState } from "react";
import { mergeIntervals, calculateProgress } from "@/lib/progress-utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
} from "lucide-react";

interface VideoPlayerProps {
  videoSrc: string;
  videoTitle: string;
}

interface WatchSession {
  currentTime: number;
  watchedIntervals: [number, number][];
  progress: number;
}

export default function VideoPlayer({
  videoSrc,
  videoTitle,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchedIntervals, setWatchedIntervals] = useState<[number, number][]>(
    []
  );
  const [currentInterval, setCurrentInterval] = useState<
    [number, number] | null
  >(null);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      const savedUserId = localStorage.getItem("video-player-user-id");
      if (savedUserId) {
        return savedUserId;
      }
      const newUserId = "user-" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("video-player-user-id", newUserId);
      return newUserId;
    }

    return "temp-user-id";
  });

  const videoId = useRef(`video-${videoSrc.split("/").pop()}`);

  // Load saved session from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSession = localStorage.getItem(`${userId}-${videoId.current}`);

      if (savedSession) {
        const session: WatchSession = JSON.parse(savedSession);
        setWatchedIntervals(session.watchedIntervals);
        setProgress(session.progress);

        if (videoRef.current) {
          videoRef.current.currentTime = session.currentTime;
        }
      }
    }
  }, [userId]);

  // Save session to localStorage when progress changes
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (progress > 0 || watchedIntervals.length > 0)
    ) {
      const session: WatchSession = {
        currentTime,
        watchedIntervals,
        progress,
      };
      localStorage.setItem(
        `${userId}-${videoId.current}`,
        JSON.stringify(session)
      );
    }
  }, [progress, watchedIntervals, currentTime, userId]);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // Only update duration if it's valid
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
        setIsMetadataLoaded(true);
        console.log("Video metadata loaded. Duration:", video.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Make sure we have a valid duration
      if (video.duration && isFinite(video.duration) && video.duration !== duration) {
        setDuration(video.duration);
      }

      if (isPlaying) {
        if (currentInterval === null) {
          setCurrentInterval([video.currentTime, video.currentTime]);
        } else {
          setCurrentInterval([currentInterval[0], video.currentTime]);
        }
      }
    };

    const handleDurationChange = () => {
      // Only update duration if it's valid
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
        console.log("Duration changed:", video.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setCurrentInterval([video.currentTime, video.currentTime]);
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (currentInterval) {
        const newIntervals = [...watchedIntervals, currentInterval];
        const mergedIntervals = mergeIntervals(newIntervals);
        setWatchedIntervals(mergedIntervals);
        setCurrentInterval(null);

        // Only calculate progress if we have a valid duration
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          const newProgress = calculateProgress(mergedIntervals, video.duration);
          setProgress(newProgress);
        }
      }
    };

    const handleSeeking = () => {
      if (currentInterval && isPlaying) {
        const newIntervals = [...watchedIntervals, currentInterval];
        const mergedIntervals = mergeIntervals(newIntervals);
        setWatchedIntervals(mergedIntervals);
        setCurrentInterval([video.currentTime, video.currentTime]);

        // Only calculate progress if we have a valid duration
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          const newProgress = calculateProgress(mergedIntervals, video.duration);
          setProgress(newProgress);
        }
      }
    };

    // Force metadata load attempt
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeking", handleSeeking);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeking", handleSeeking);
    };
  }, [isPlaying, currentInterval, watchedIntervals, duration]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
        });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) {
      return "00:00";
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const enterFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen().catch(error => {
        console.error("Error entering fullscreen:", error);
      });
    }
  };

  // Calculate effective max for slider (use a reasonable default if duration isn't available)
  const effectiveMax = isFinite(duration) && duration > 0 ? duration : 100;

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">{videoTitle}</h2>
        {!isMetadataLoaded && (
          <p className="text-sm text-amber-600">Loading video metadata...</p>
        )}
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black"
          src={videoSrc}
          playsInline
          preload="metadata"
        />

        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex flex-col gap-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={effectiveMax}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(-10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>

                <div className="w-24 hidden sm:block">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">
                  {Math.round(progress)}% completed
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={enterFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Your Progress</h3>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% unique content watched
          </span>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-4 text-sm text-gray-600">
          This progress tracker only counts unique segments of the video you've
          watched. Rewatching the same parts won't increase your progress.
        </p>
      </div>
    </div>
  );
}
