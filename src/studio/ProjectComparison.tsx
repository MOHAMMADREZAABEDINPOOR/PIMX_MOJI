import { useRef, useState } from "react";
import { ArtPreview, type Translate } from "./ui";
import type { Project } from "./types";

export function ProjectComparison({ project, t }: { project: Project; t: Translate }) {
  const [split, setSplit] = useState(50);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const moveDivider = (element: HTMLInputElement, x: number) => {
    const rect = element.getBoundingClientRect();
    setSplit(Math.round(Math.max(0, Math.min(100, (x - rect.left) / rect.width * 100))));
  };
  const before = t("Before", "\u0642\u0628\u0644");
  const after = t("After", "\u0628\u0639\u062f");
  return <div className="project-comparison" dir="ltr">
    <img src={project.source} alt={`${before}: ${project.name}`} loading="lazy" />
    <div className="project-comparison-result" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
      <ArtPreview source={project.source} options={project.options} fullDetail label={`${after}: ${project.name}`} />
      <span className="project-comparison-status" role="status">{t("Preparing artwork...", "\u062f\u0631 \u062d\u0627\u0644 \u0633\u0627\u062e\u062a \u067e\u06cc\u0634\u200c\u0646\u0645\u0627\u06cc\u0634...")}</span>
      <span className="project-comparison-error">{t("Preview unavailable. Open the project to try again.", "\u067e\u06cc\u0634\u200c\u0646\u0645\u0627\u06cc\u0634 \u0622\u0645\u0627\u062f\u0647 \u0646\u0634\u062f\u061b \u067e\u0631\u0648\u0698\u0647 \u0631\u0648 \u0628\u0627\u0632 \u06a9\u0646.")}</span>
    </div>
    <span className="project-comparison-label label-before" dir="auto">{before}</span>
    <span className="project-comparison-label label-after" dir="auto">{after}</span>
    <div className="project-comparison-divider" style={{ left: `${split}%` }} aria-hidden="true"><span>‹›</span></div>
    <input className="project-comparison-slider" type="range" min={0} max={100} value={split}
      aria-label={`${t("Compare before and after", "\u0645\u0642\u0627\u06cc\u0633\u0647 \u0642\u0628\u0644 \u0648 \u0628\u0639\u062f")}: ${project.name}`}
      aria-valuetext={`${before} ${split}%, ${after} ${100 - split}%`}
      onChange={e => setSplit(Number(e.target.value))}
      onPointerDown={e => {
        gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        if (e.pointerType === "mouse") moveDivider(e.currentTarget, e.clientX);
      }}
      onPointerMove={e => {
        const start = gesture.current;
        if (!start || start.id !== e.pointerId) return;
        if (Math.abs(e.clientX - start.x) > Math.abs(e.clientY - start.y)) moveDivider(e.currentTarget, e.clientX);
      }}
      onPointerUp={e => {
        const start = gesture.current;
        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) moveDivider(e.currentTarget, e.clientX);
        gesture.current = null;
      }}
      onPointerCancel={() => { gesture.current = null; }} />
  </div>;
}
