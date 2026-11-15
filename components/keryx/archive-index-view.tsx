/**
 * The body of the answer archive index, shared by /answers and /answers/page/[n].
 *
 * Both routes render the identical document apart from which slice of the corpus they carry, so
 * the markup lives here once: a page-2 visitor (or crawler) sees the same headline, the same topic
 * chips and the same filter as someone landing on the index, and the two can't drift apart.
 */

import { createMessages } from "@/lib/i18n/messages";

import Link from "next/link";
import type { ArchiveEntry } from "@/lib/answers-archive";
import { searchTerm } from "@/lib/answers-archive";
import type { ArchivePage } from "@/lib/answers-pagination";
import type { ArchiveTopic } from "@/lib/answers-topics";
import { ArchiveAnswerRow } from "./archive-answer-row";
import { ArchiveSearch } from "./archive-search";
import { ArchivePagination } from "./archive-pagination";
import { ArchiveTopicChips } from "./archive-topic-chips";
import { ProductEntryNote } from "./product-guide";
import { ArchiveLanguageFilter } from "./archive-language-filter";
import { UiMessage, UiRichMessage, UiText } from "@/lib/i18n/ui-copy";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ArrowUpRight } from "@untitledui/icons";



const copy = createMessages("en");


export function ArchiveIndexView({
  slice,
  topics,
  totalEntries,
  languages = [],
  language = null,
}: {
  slice: ArchivePage;
  topics: ArchiveTopic[];
  /** Size of the whole archive, not this page — the headline counts the corpus. */
  totalEntries: number;
  languages?: Array<{ language: string; count: number }>;
  language?: string | null;
}) {
  return (
    <main className="mx-auto max-w-[1000px] px-4 pb-14 pt-8 sm:px-8 sm:pt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Badge type="modern" color="gray" size="sm" className="font-sans text-xs font-medium">
          {slice.page > 1 ? <UiMessage messageKey={"archiveIndex.page"} values={{ page: slice.page, pages: slice.totalPages }} /> : <UiMessage messageKey={"archiveIndex.kicker"} />}
        </Badge>
        <Button
          href={language ? `/answers/feed.xml?${new URLSearchParams({ language })}` : "/answers/feed.xml"}
          color="tertiary"
          size="sm"
          iconTrailing={<ArrowUpRight aria-hidden="true" data-icon className="size-4" />}
          className="rounded-lg text-xs text-ink-3"
        >
          <UiMessage messageKey={"archiveIndex.feed"} />
        </Button>
      </div>
      <h1 className="font-sans text-[clamp(32px,4.4vw,46px)] font-semibold leading-tight tracking-[-0.04em] text-ink">
        <UiRichMessage messageKey={"archiveIndex.title"} values={{ emphasis: <span className="font-normal text-ink-3"><UiMessage messageKey={"archiveIndex.emphasis"} /></span> }} />
      </h1>
      <p className="mt-3 max-w-[62ch] font-sans text-base leading-7 text-ink-2">
        {totalEntries > 0 ? (
          <>
            <UiMessage messageKey={totalEntries === 1 ? "archiveIndex.summary.one" : "archiveIndex.summary.other"} values={{ count: totalEntries }} />
          </>
        ) : (
          <><UiMessage messageKey={"archiveIndex.empty"} /></>
        )}
      </p>
      <Link href="/history/testnet" className="mt-1 inline-flex min-h-10 items-center text-sm font-medium text-seal underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-seal"><UiMessage messageKey={"archiveIndex.testnet"} /></Link>
      <ArchiveLanguageFilter languages={languages} selected={language} />

      {slice.items.length > 0 && (
        <ArchiveSearch
          terms={slice.items.map(searchTerm)}
          others={slice.rest.map(toSearchEntry)}
          filters={<ArchiveTopicChips topics={topics} />}
        >
          {slice.items.map((e) => (
            <ArchiveAnswerRow key={e.id} entry={e} />
          ))}
        </ArchiveSearch>
      )}

      <ArchivePagination page={slice.page} totalPages={slice.totalPages} language={language} />

      <div className="mt-10"><ProductEntryNote /></div>

      <div className="mt-10 border-t border-line pt-5">
        <Button href="/" size="md" color="primary" iconTrailing={<ArrowUpRight aria-hidden="true" data-icon className="size-4" />} className="rounded-lg">
          <UiMessage messageKey={"archiveIndex.ask"} />
        </Button>
      </div>
    </main>
  );
}

/** An off-page entry, trimmed to what the filter needs: something to match, something to link. */
function toSearchEntry(e: ArchiveEntry) {
  return { id: e.id, question: e.question, sources: e.sourceNames.join(" ") };
}
