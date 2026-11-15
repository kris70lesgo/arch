import Link from "next/link";
import { KeryxGlyph } from "./keryx-mark";
import { currentArcLabel } from "@/lib/arc-network-display";
import { UiMessage } from "@/lib/i18n/ui-copy";

export function SiteFooter() {
  return (
    <footer lang="en" className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-opacity hover:opacity-75">
          <KeryxGlyph size={20} reeded={false} />
          <span>Arch</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-3" aria-label="Legal and proof">
          <Link href="/proof" className="transition-colors hover:text-ink"><UiMessage messageKey="shellFooter.publicProof" /></Link>
          <Link href="/privacy" className="transition-colors hover:text-ink"><UiMessage messageKey="shellFooter.privacy" /></Link>
          <Link href="/terms" className="transition-colors hover:text-ink"><UiMessage messageKey="shellFooter.terms" /></Link>
        </nav>
        <span className="text-xs text-ink-3">© 2026 Arch · {currentArcLabel}</span>
      </div>
    </footer>
  );
}
