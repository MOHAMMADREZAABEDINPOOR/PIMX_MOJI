import { useCallback, useRef, useState } from "react";
import { DEFAULTS, type StudioOptions } from "./types";
export function useTimeline() {
  const [timeline, setTimeline] = useState({
    frames: [structuredClone(DEFAULTS)],
    index: 0,
  });
  const last = useRef({ key: "", time: 0 });
  const change = useCallback((patch: Partial<StudioOptions>, group = "") => {
    const now = Date.now();
    const merge =
      !!group && group === last.current.key && now - last.current.time < 450;
    last.current = { key: group, time: now };
    setTimeline((t) => {
      const value = { ...t.frames[t.index], ...patch };
      const frames = t.frames.slice(0, t.index + 1);
      if (merge && t.index > 0) frames[t.index] = value;
      else frames.push(value);
      const capped = frames.slice(-70);
      return { frames: capped, index: capped.length - 1 };
    });
  }, []);
  const reset = useCallback((options: StudioOptions) => {
    last.current = { key: "", time: 0 };
    setTimeline({ frames: [structuredClone(options)], index: 0 });
  }, []);
  const undo = useCallback(() => {
    last.current.key = "";
    setTimeline((t) => ({ ...t, index: Math.max(0, t.index - 1) }));
  }, []);
  const redo = useCallback(() => {
    last.current.key = "";
    setTimeline((t) => ({
      ...t,
      index: Math.min(t.frames.length - 1, t.index + 1),
    }));
  }, []);
  return {
    options: timeline.frames[timeline.index],
    change,
    reset,
    undo,
    redo,
    canUndo: timeline.index > 0,
    canRedo: timeline.index < timeline.frames.length - 1,
  };
}
