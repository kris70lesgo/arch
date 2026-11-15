import { SiteHeader } from "@/components/keryx/site-header";
import { ResearchChat } from "@/components/keryx/research-chat";
import { LandingVisit } from "@/components/keryx/landing-visit";
import { AsciiCurrent } from "@/components/keryx/ascii-current";



export default function AskPage() {
  return <div className="relative isolate min-h-dvh bg-paper-2 text-ink">
    <LandingVisit />
    <AsciiCurrent />
    <div className="relative z-10">
      <SiteHeader />
      <main className="relative z-10 w-full">
        <ResearchChat introduceProduct />
      </main>
    </div>
  </div>;
}
