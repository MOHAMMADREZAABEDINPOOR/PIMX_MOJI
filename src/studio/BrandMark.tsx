/** A character face between code brackets: pixels becoming personality. */
export function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={`brand-mark ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path className="mark-brackets" d="M17 10H9v44h8M47 10h8v44h-8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <g className="mark-pixels" fill="currentColor"><rect x="22" y="21" width="7" height="8" rx="2"/><rect x="36" y="21" width="7" height="8" rx="2"/><rect x="22" y="36" width="7" height="7" rx="2"/><rect x="29" y="43" width="7" height="7" rx="2"/><rect x="36" y="36" width="7" height="7" rx="2"/></g>
    <path className="mark-spark" d="m43 4 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#a08aff" />
  </svg>;
}
