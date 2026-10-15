import { useEffect, useRef, useState } from "react";

/** A brief character assembly; the accessible name and text layout stay stable. */
export function LiveText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);
  const play = () => {
    cancelAnimationFrame(frame.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || /[^\x00-\x7F]/.test(text)) return;
    const start = performance.now();
    const glyphs = ".:+*#@";
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 600);
      setDisplay([...text].map((letter, i) => i < progress * text.length || letter === " " ? letter : glyphs[(i + Math.floor(now / 65)) % glyphs.length]).join(""));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => { setDisplay(text); play(); return () => cancelAnimationFrame(frame.current); }, [text]);
  return <span className="live-text" onPointerEnter={play}><span>{text}</span><span className="live-text-display" aria-hidden="true">{display}</span></span>;
}
