"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { currentArcLabel } from "@/lib/arc-network-display";
import { UiMessage, useUiMessages } from "@/lib/i18n/ui-copy";
import { Button } from "@/components/base/buttons/button";
import { ArrowRight } from "@untitledui/icons";



const steps = [
  { target: "hero", title: "researchTour.budgetTitle", body: "researchTour.budgetBody" },
  { target: "ask-form", title: "researchTour.questionTitle", body: "researchTour.questionBody" },
  { target: "budget", title: "researchTour.capTitle", body: "researchTour.capBody" },
  { target: "dispatch-btn", title: "researchTour.startTitle", body: "researchTour.startBody" },
] as const;

export function OnboardingTour() {
  const message = useUiMessages();
  const id = useId();
  const titleId = `${id}-title`, bodyId = `${id}-body`, maskId = `${id}-spotlight`;
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setActive(false);
    setPortalRoot(null);
  }, []);

  useEffect(() => {
    if (!active) return;
    const host = document.createElement("div");
    const triggerElement = trigger.current?.querySelector<HTMLButtonElement>("button") ?? null;
    host.setAttribute("data-keryx-tour-portal", "");
    document.body.appendChild(host);
    const background = Array.from(document.body.children).filter((child) => child !== host && child.tagName !== "SCRIPT");
    const prior = background.map((element) => ({ element, inert: element.hasAttribute("inert"), ariaHidden: element.getAttribute("aria-hidden") }));
    for (const element of background) { element.setAttribute("inert", ""); element.setAttribute("aria-hidden", "true"); }
    const frame = window.requestAnimationFrame(() => setPortalRoot(host));
    return () => {
      window.cancelAnimationFrame(frame);
      for (const { element, inert, ariaHidden } of prior) {
        if (!inert) element.removeAttribute("inert");
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      host.remove();
      triggerElement?.focus();
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (steps[step].target === "budget") document.dispatchEvent(new CustomEvent("keryx:tour-budget"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const findTarget = () => document.querySelector<HTMLElement>(`[data-tour="${steps[step].target}"]`);
    const scrollTarget = () => {
      const target = findTarget();
      if (!target) return;
      if (window.innerWidth < 640) {
        const offset = window.innerHeight <= 480 ? 80 : 120;
        window.scrollBy({ top: target.getBoundingClientRect().top - offset, behavior: reduced ? "instant" : "smooth" });
      } else {
        target.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" });
      }
    };
    const frame = window.requestAnimationFrame(scrollTarget);
    let layoutFrame: number | null = null;
    let observedTarget: HTMLElement | null = null;
    const schedule = () => {
      if (layoutFrame !== null) return;
      layoutFrame = window.requestAnimationFrame(() => { layoutFrame = null; update(); });
    };
    const observer = new ResizeObserver(schedule);
    const update = () => {
      const target = findTarget();
      if (target !== observedTarget) {
        observer.disconnect();
        if (target) observer.observe(target);
        observedTarget = target;
      }
      const next = target?.getBoundingClientRect() ?? null;
      setRect(current => current && next && current.x === next.x && current.y === next.y && current.width === next.width && current.height === next.height ? current : next);
      setSize(current => current.width === window.innerWidth && current.height === window.innerHeight ? current : { width: window.innerWidth, height: window.innerHeight });
    };
    update();
    const timer = window.setTimeout(update, reduced ? 0 : 450);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      if (layoutFrame !== null) window.cancelAnimationFrame(layoutFrame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [active, step]);

  useEffect(() => {
    if (!active || !portalRoot) return;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !panel.current) return;
      const controls = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'));
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [active, close, portalRoot]);

  const narrow = size.width < 640;
  const width = Math.min(340, Math.max(0, size.width - 16));
  const spotlight = rect && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < size.height && rect.left < size.width ? {
    x: Math.max(4, rect.left - 8), y: Math.max(4, rect.top - 8),
    width: Math.max(0, Math.min(size.width - 4, rect.right + 8) - Math.max(4, rect.left - 8)),
    height: Math.max(0, Math.min(size.height - 4, rect.bottom + 8) - Math.max(4, rect.top - 8)),
  } : null;

  return (
    <>
      <div ref={trigger}>
        <Button type="button" onPress={() => { setStep(0); setActive(true); }} size="sm" color="secondary" className="min-h-11 max-w-full rounded-lg font-sans text-xs [overflow-wrap:anywhere]">
          <UiMessage messageKey="researchTour.open" />
        </Button>
      </div>
      {active && portalRoot && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" aria-hidden="true" onClick={close}>
            <svg className="pointer-events-none h-full w-full" width={size.width} height={size.height}>
              <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={size.width} height={size.height}>
                <rect width="100%" height="100%" fill="white" />
                {spotlight && <rect {...spotlight} rx="10" fill="black" />}
              </mask></defs>
              <rect width="100%" height="100%" fill="var(--ink)" fillOpacity=".65" mask={`url(#${maskId})`} />
              {spotlight && <rect key={step} {...spotlight} rx="10" fill="none" stroke="var(--seal)" strokeWidth="1.5" className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" />}
            </svg>
          </div>
          <div ref={panel} role="dialog" aria-modal="true" aria-label={message("researchTour.label")} aria-describedby={bodyId} className="fixed z-[9999] flex max-h-[calc(100dvh-16px)] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200" style={narrow ? { left: 8, right: 8, bottom: 8, maxHeight: "min(calc(100dvh - 16px), max(12.5rem, 50dvh))" } : { width, right: 8, bottom: 8 }}>
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-paper-2 px-5 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-seal"><UiMessage messageKey="researchTour.step" values={{ number: step + 1, total: steps.length }} /></p>
                <div aria-hidden="true" className="mt-2 flex gap-1">{steps.map((item, index) => <span key={item.target} className={`h-0.5 w-5 ${index <= step ? "bg-seal" : "bg-line"}`} />)}</div>
              </div>
              <Button type="button" onPress={close} aria-label={message("researchTour.closeLabel")} size="sm" color="secondary" className="min-h-11 shrink-0 rounded-lg font-sans text-xs"><UiMessage messageKey="researchTour.close" /></Button>
            </header>
            <div role="region" tabIndex={0} aria-labelledby={titleId} aria-live="polite" aria-atomic="true" className="min-h-0 overflow-y-auto overscroll-contain px-5 py-3 sm:py-5 [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-seal">
              <div key={step} className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                <h2 id={titleId} className="font-sans text-2xl font-semibold leading-tight tracking-tight text-ink"><UiMessage messageKey={steps[step].title} /></h2>
                <p id={bodyId} className="mt-3 font-sans text-sm leading-6 text-ink-2"><UiMessage messageKey={steps[step].body} values={{ network: currentArcLabel }} /></p>
              </div>
            </div>
            <footer className="flex shrink-0 flex-wrap justify-between gap-3 border-t border-line bg-paper-2 px-5 py-3">
              <Button type="button" isDisabled={step === 0} onPress={() => setStep(step - 1)} size="sm" color="secondary" className="min-h-11 rounded-lg font-sans text-xs"><UiMessage messageKey="researchTour.back" /></Button>
              <Button type="button" onPress={() => step === steps.length - 1 ? close() : setStep(step + 1)} iconTrailing={<ArrowRight data-icon="trailing" aria-hidden="true" />} size="sm" color="primary" className="ms-auto min-h-11 rounded-lg font-sans text-xs"><UiMessage messageKey={step === steps.length - 1 ? "researchTour.done" : "researchTour.next"} /></Button>
            </footer>
          </div>
        </>
      , portalRoot)}
    </>
  );
}
