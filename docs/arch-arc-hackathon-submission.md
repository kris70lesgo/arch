# Arch — SERV Hackathon Edition 02

## Recommended entry

- **Track:** Reppo
- **Why it fits:** Every review starts with SERV Reasoning, which builds a focused brief and evidence checks from a public research report. Reppo independently evaluates that packet. SERV can then draft a conservative revision for the user to inspect, and Reppo can evaluate the revision again.
- **Track choice:** The official form asks applicants to choose a track (singular). Enter Reppo only. The current app does not integrate Dolphin models or Kite Passport, so it should not claim those tracks.
- **Project history:** Arch is the hackathon name for the existing Keryx project. Describe the SERV-to-Reppo review and revision loop as the hackathon addition; do not imply the whole research product was created during this event.

## Short write-up draft

Arch is a citation-led research agent built on the existing Keryx project. It turns a question into a public report with cited sources and visible research decisions. For the SERV Hackathon, we added a feedback loop for the Reppo track: SERV Reasoning prepares an evidence-aware brief and concrete evaluation checks from a report; Reppo evaluates the answer, citations and recorded reasoning; then SERV can draft a cautious revision for the user to review before Reppo evaluates it again. The original report and payment records remain unchanged. Reppo scores are advisory feedback, not proof of factual correctness. The loop makes evaluation and revision visible inside a working research product rather than presenting a standalone model call.

## Submission links

- **Public repository:** [github.com/tang-vu/keryx](https://github.com/tang-vu/keryx) — publish the hackathon implementation before submitting; the current local changes are not on the remote yet.
- **Demo:** Add a public demo URL or video after deploying the current branch. `http://localhost:3018` is only a local preview and cannot be submitted as the judge demo.
- **X post:** Add the public post URL to the form. The post must tag [@openservai](https://x.com/openservai).
- **Official form:** [SERV Hackathon submissions](https://openserv.typeform.com/submissions02)

## X post draft

For the @openservai SERV Hackathon 02 Reppo track, we added a review loop to Arch: SERV Reasoning prepares evidence checks, Reppo evaluates a cited research report, and a user-reviewed SERV revision can be evaluated again. The scores are advisory; the original report stays intact.

Demo: [add public demo URL] · Repo: https://github.com/tang-vu/keryx

## Before submitting

- Publish the reviewed code to the public repository and deploy or record the exact build being submitted.
- Confirm the deployed environment has server-side `SERV_REASONING_API_KEY`, `SERV_REASONING_MODEL`, and `REPPO_EVAL_API_KEY` set. Never put these values in browser code or the repository.
- The general web-search provider is currently unconfigured. Research still supports supplied public URLs and its existing scholarly connectors, but a configured search provider is needed for normal broad web discovery. Add `TAVILY_API_KEY` and set `KERYX_WEB_SEARCH_PROVIDER=tavily` before a broad-web demo, or use a documented SearXNG endpoint.
- Make one fresh public report, sign in, request one Reppo review, and capture the returned evaluation state/result in the demo. Reppo reviews may consume credits and are sent to independent evaluators.
- Submit before **November 15, 2026 at 23:59 UTC**. The official form also requires the X post link and applicant details.
