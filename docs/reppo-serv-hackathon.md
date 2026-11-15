# Arch: SERV + Reppo report review

Arch is the hackathon submission name for the existing Keryx research
application and codebase. The repository and technical service identifiers
continue to use Keryx.

Keryx public reports can be submitted to a separate review flow for the SERV
Hackathon 02 Reppo track. On a public, non-historical dispatch, a signed-in
Keryx account can explicitly request a review. SERV Reasoning first generates a
short evidence-aware brief and checklist. Keryx then submits the question,
answer, citation references, visible reasoning messages and SERV brief to the
Reppo Evaluation API as a `response` evaluation. The report and its payment
records are unchanged.

## Server configuration

Set these server-only environment variables on the Keryx deployment:

- `SERV_REASONING_API_KEY`: API key for SERV Reasoning.
- `SERV_REASONING_MODEL`: a model enabled for that SERV account.
- `REPPO_EVAL_API_KEY`: API key for the Reppo Eval API.

No keys are sent to the browser. Requests use the OpenAI-compatible SERV
endpoint at `https://inference-api.openserv.ai/v1/chat/completions` and Reppo's
agent evaluations API at `https://eval.reppo.xyz/api/v1/agents/evals`. The
Reppo endpoint returns an evaluation ID; Keryx polls the matching evaluation
through the authenticated dispatch route. A signed, short-lived ticket binds
that ID to the report and requesting wallet without saving a new report record.

## User and data boundaries

- The person requesting a review must be signed in with a Keryx wallet.
- Each Keryx account can submit up to three reviews per day; the quota is
  durable and shared across the deployment.
- The UI discloses that the public question, answer, citation references and
  visible reasoning messages are sent to SERV and Reppo. The deployment's
  configured accounts are used, so a completed review may consume Reppo credits.
- Only public, non-historical reports qualify. Keryx rechecks visibility before
  submission and before every poll.
- Private payment data, account secrets and hidden report material are not part
  of the evaluation packet. Citation query strings and fragments are removed.
- A timeout while posting to Reppo is treated as unknown. Keryx does not retry
  that submission automatically; check Reppo's evaluation history first.
- Reppo's score, critique and route are advisory. They are not factual ground
  truth and do not approve, reverse or settle any payment.

The Reppo API currently documents `taskType: "response"`, a 50 KB input bound,
and `QUEUED` / `PROCESSING` / `COMPLETED` / `FAILED` states. It may take time
for independent reviewers to finish; the report card polls for the resulting
score, route, confidence, reason and rubric scores. After a completed review,
the user can ask SERV for a conservative revision draft, edit it, then submit it
for a second Reppo evaluation. The UI shows the score change against the first
completed evaluation; this is a feedback signal, not proof of factual
improvement. Revision drafts and Reppo evaluations each have a limit of three
per signed-in account per day.
