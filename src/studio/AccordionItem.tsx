import { useId, useState } from "react";
import { Plus } from "lucide-react";

export function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div className={`faq-item ${open ? "is-open" : ""}`}>
    <h3><button aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><span>{question}</span><Plus size={19} aria-hidden="true" /></button></h3>
    <div className="faq-answer" id={id} aria-hidden={!open} inert={!open}><div><p>{answer}</p></div></div>
  </div>;
}
