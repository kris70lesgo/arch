"use client";

import { useEffect, useMemo, useState } from "react";
import { NavigationLink as Link } from "./navigation-link";
import { usePathname } from "next/navigation";
import { KeryxWordmark } from "./keryx-mark";
import { DispatchWire } from "./dispatch-wire";
import { WalletMenu } from "./wallet-menu";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";
import { createMessages } from "@/lib/i18n/messages";
import { productGuideCopy } from "@/locales/en/product-guide";
import { setupCopy } from "@/locales/en/get-started";
import { useLocale } from "@/lib/i18n/locale-context";
import { useUiCopy, useUiCopyFunction, useUiMessages } from "@/lib/i18n/ui-copy";
import { Button } from "@/components/base/buttons/button";
import {
  Activity,
  BookOpen01,
  ChevronDown,
  ChevronLeftDouble,
  ChevronRightDouble,
  Command,
  HomeLine,
  Menu01 as Menu,
  Plus,
  SearchLg,
  User01,
  X,
} from "@untitledui/icons";
import { currentArcLabel } from "@/lib/arc-network-display";

function navigation(message: ReturnType<typeof createMessages>, guide = productGuideCopy, setup = setupCopy) {
  return [
    { href: "/", label: message("shellNavigation.ask") },
    { href: "/answers", label: message("shellNavigation.answers") },
    { href: "/sources", label: message("shellNavigation.sources") },
    { href: "/pricing", label: guide("product.navigationPricing") },
    { href: "/about", label: guide("product.navigationAbout") },
    { href: "/get-started", label: setup.navigation.start },
    { href: "/dashboard", label: message("shellNavigation.activity") },
    { href: "/operator", label: message("shellNavigation.operator") },
    { href: "/literature", label: message("shellNavigation.literature") },
    { href: "/market", label: message("shellNavigation.market") },
    { href: "/integrations/mcp", label: "MCP" },
    { href: "/wanted", label: message("shellNavigation.wanted") },
    { href: "/register", label: message("shellNavigation.creators") },
    { href: "/me/sources", label: message("shellNavigation.mySources") },
    { href: "/me/asks", label: message("shellNavigation.myDispatches") },
    { href: "/playground", label: message("shellNavigation.playground") },
    { href: "/research", label: message("shellNavigation.research") },
    { href: "/dev", label: message("shellNavigation.developer") },
    { href: "/download", label: setup.navigation.download },
    { href: "/integrations", label: setup.navigation.integrations },
  ];
}

function iconFor(href: string) {
  if (href === "/") return HomeLine;
  if (href === "/answers") return BookOpen01;
  if (href === "/sources") return SearchLg;
  if (href === "/register") return User01;
  return Activity;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function WorkspaceLink({
  href,
  label,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, href);
  const Icon = iconFor(href);
  return (
    <Link
      href={href}
      onNavigate={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal",
        active ? "bg-seal/10 text-seal" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SiteHeader() {
  const shell = useLocale();
  const { locale } = shell;
  const message = useUiMessages(shell.message);
  const guide = useUiCopyFunction("product-guide", productGuideCopy);
  const setup = useUiCopy("get-started", setupCopy);
  const nav = useMemo(() => navigation(message, guide, setup), [message, guide, setup]);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPreferenceReady, setSidebarPreferenceReady] = useState(false);
  const primary = nav.slice(0, 3);
  const creators = nav.find((link) => link.href === "/register")!;
  const more = nav.filter((link) => !["/", "/answers", "/sources", "/register"].includes(link.href));
  const pageLabel = nav.find((link) => isActive(pathname, link.href))?.label ?? "Workspace";

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem("keryx:sidebar-collapsed") === "true");
    } catch {
      // Keep the default expanded state if browser storage is unavailable.
    }
    setSidebarPreferenceReady(true);
  }, []);
  useEffect(() => {
    if (!sidebarPreferenceReady) return;
    document.body.dataset.keryxSidebar = sidebarCollapsed ? "collapsed" : "expanded";
    try {
      window.localStorage.setItem("keryx:sidebar-collapsed", String(sidebarCollapsed));
    } catch {
      // The current page still responds when browser storage is unavailable.
    }
  }, [sidebarCollapsed, sidebarPreferenceReady]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        document.querySelector<HTMLButtonElement>('[aria-controls="mobile-workspace-menu"]')?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const navigationLinks = (mobile = false) => (
    <>
      <div className="space-y-1">
        {primary.map((link) => (
          <WorkspaceLink key={link.href} {...link} pathname={pathname} onNavigate={mobile ? () => setMenuOpen(false) : undefined} />
        ))}
      </div>
      <div className="mt-7 space-y-1">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">{message("shellHeader.explore")}</p>
        <WorkspaceLink {...creators} pathname={pathname} onNavigate={mobile ? () => setMenuOpen(false) : undefined} />
        <details className="group/more">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal [&::-webkit-details-marker]:hidden">
            <Command aria-hidden="true" className="size-4 shrink-0" />
            <span className="flex-1">{message("shellHeader.moreTools")}</span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open/more:rotate-180" />
          </summary>
          <div className="ml-4 mt-1 space-y-1 border-l border-line pl-3">
            {more.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onNavigate={mobile ? () => setMenuOpen(false) : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex min-h-9 items-center rounded-lg px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal", active ? "bg-seal/10 text-seal" : "text-ink-2 hover:bg-paper-2 hover:text-ink")}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </details>
      </div>
    </>
  );

  return (
    <>
      <aside id="keryx-workspace-sidebar" lang={locale} aria-hidden={sidebarCollapsed} inert={sidebarCollapsed}
        className={cn("fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-line bg-sidebar transition-transform duration-200 ease-out motion-reduce:transition-none lg:flex",
          sidebarCollapsed ? "pointer-events-none -translate-x-full" : "translate-x-0")}
        aria-label="Arch workspace">
        <div className="px-4 pt-5">
          <Link href="/" className="inline-flex rounded-lg transition-opacity hover:opacity-80">
            <KeryxWordmark />
          </Link>
          <Button href="/" size="md" color="primary" iconLeading={Plus} className="mt-7 w-full justify-start rounded-xl px-3.5 py-3">
            {message("researchChat.newResearch")}
          </Button>
        </div>
        <nav className="mt-8 min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Workspace navigation">
          {navigationLinks()}
        </nav>
        <div className="space-y-3 border-t border-line px-4 py-4">
          <div className="flex items-center gap-2 rounded-lg bg-paper-2 px-3 py-2 text-xs text-ink-2">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="font-medium">{currentArcLabel}</span>
          </div>
          <LanguageSwitcher />
          <nav className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-3" aria-label="Legal and proof">
            <Link href="/proof" className="transition-colors hover:text-ink">{message("shellFooter.publicProof")}</Link>
            <Link href="/privacy" className="transition-colors hover:text-ink">{message("shellFooter.privacy")}</Link>
            <Link href="/terms" className="transition-colors hover:text-ink">{message("shellFooter.terms")}</Link>
          </nav>
        </div>
      </aside>

      <header lang={locale} className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="inline-flex lg:hidden"><KeryxWordmark /></Link>
          <div className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
            <Button
              type="button"
              color="tertiary"
              size="md"
              iconLeading={sidebarCollapsed ? ChevronRightDouble : ChevronLeftDouble}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
              aria-controls="keryx-workspace-sidebar"
              onPress={() => setSidebarCollapsed((collapsed) => !collapsed)}
              className="rounded-lg p-2"
            />
            <span className="text-ink-3">Workspace</span>
            <span aria-hidden="true" className="text-ink-3">/</span>
            <span className="truncate font-medium text-ink">{pageLabel}</span>
          </div>
          <Button
            type="button"
            color="tertiary"
            size="md"
            iconLeading={menuOpen ? X : Menu}
            aria-label={menuOpen ? message("shellHeader.closeMenu") : message("shellHeader.openMenu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-workspace-menu"
            onPress={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 lg:hidden"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <WalletMenu />
        </div>
      </header>

      {menuOpen && (
        <div id="mobile-workspace-menu" className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-sidebar p-3 shadow-xl lg:hidden">
          <nav className="mx-auto max-w-xl" aria-label={message("shellHeader.mobileNavigation")}>
            {navigationLinks(true)}
            <div className="mt-4 border-t border-line px-3 pt-3"><LanguageSwitcher /></div>
          </nav>
        </div>
      )}
      <DispatchWire />
    </>
  );
}
