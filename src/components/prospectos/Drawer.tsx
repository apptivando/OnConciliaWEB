"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Panel lateral que se desliza desde la derecha, con la lista de atrás
 * **visible y usable**. Adaptado del panel de admin de FORCOM (mismo
 * comportamiento, paleta clara de OnConcilia en vez de tema oscuro).
 *
 * ─── Por qué no es un modal ───────────────────────────────────────────────
 * `<dialog showModal()>` regalaría Escape, focus trap y top layer nativos,
 * pero **inertiza el fondo**: saltar de un prospecto a otro haciendo click en
 * otra fila —que es el punto de que sea un panel y no un modal— dejaría de
 * funcionar.
 *
 * Por la misma razón **no hay click-fuera para cerrar** en escritorio: cada
 * click en una fila sería a la vez "abrir esta ficha" y "cerrar el panel". Se
 * cierra con Escape, con la X, o con el botón "atrás" del navegador. En
 * pantallas chicas el panel va a ancho completo, la lista queda tapada, y ahí
 * sí hay velo que cierra al tocarlo.
 *
 * ─── Detalles que costaron (en el original) ───────────────────────────────
 * - Sin `createPortal`: alcanza con no renderizarlo dentro de un `<tbody>`.
 * - `aria-modal="false"` y sin focus trap: atrapar el foco sin declararse
 *   modal le miente al lector de pantalla.
 * - `z-40`, no `z-50`: ese queda para lo verdaderamente modal.
 */

type Phase = "closed" | "entering" | "open" | "leaving";

const EXIT_MS = 200;

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>(open ? "entering" : "closed");
  const [wasOpen, setWasOpen] = useState(open);
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    setPhase(open ? "entering" : "leaving");
  }

  useEffect(() => {
    if (phase === "entering") {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      const raf = requestAnimationFrame(() => setPhase("open"));
      return () => cancelAnimationFrame(raf);
    }
    if (phase === "leaving") {
      const timer = setTimeout(() => {
        setPhase("closed");
        returnFocusRef.current?.focus?.();
      }, EXIT_MS);
      return () => clearTimeout(timer);
    }
    if (phase === "open") panelRef.current?.focus();
  }, [phase]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (e.defaultPrevented) return;
      e.preventDefault();
      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  if (phase === "closed") return null;

  const shown = phase === "open";

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity duration-200 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label={typeof title === "string" ? title : "Ficha"}
        tabIndex={-1}
        className={`fixed inset-y-0 right-0 z-40 w-full lg:w-[560px]
                    bg-white border-l border-slate-200 flex flex-col
                    shadow-[0_0_40px_rgba(0,0,0,0.15)] outline-none
                    transition-transform duration-200 ease-out
                    motion-reduce:transition-none
                    ${shown ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <div className="font-semibold text-navy truncate">{title}</div>
            {subtitle && <div className="text-[13px] text-slate-500 mt-0.5 truncate">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-1 -m-1"
            title="Cerrar (Esc)"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </aside>
    </>
  );
}
