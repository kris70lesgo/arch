# Arch

Arch is a research workspace for source-backed answers. Ask a question, review the cited evidence and research decisions, and keep the resulting report inspectable.

The optional evaluation flow connects **SERV Reasoning** and **Reppo**: SERV prepares a focused review brief, Reppo evaluates a public report, and SERV can draft a revision for the user to review before another evaluation. Reppo scores are feedback, not proof of factual accuracy. The original report stays unchanged.

[Open the UI preview](https://arch-zeta-five.vercel.app) · [Report an issue](https://github.com/kris70lesgo/arch/issues) · [Read the development workflow](docs/development-workflow.md)

> **Deployment status:** The Vercel site currently serves the interface, but its API routes need persistent storage before research can run. The production guide describes the supported server deployment and storage requirements: [deployment guide](docs/deployment-guide.md).

## What Arch does

- Turns research questions into reports with citations and visible source decisions.
- Lets readers inspect source excerpts and the recorded research trail.
- Adds an optional SERV-to-Reppo review and user-reviewed revision loop for public reports.
- Includes researcher tools and optional source-payment workflows that require separate service and storage configuration.

## Technology

- Next.js App Router, React, and TypeScript
- Tailwind CSS
- Local SQLite for development; an external database adapter is available for configured deployments
- SERV Reasoning and Reppo for the optional evaluation workflow

## Run locally

### Requirements

- Node.js 24.22.1 and npm 11.19.0, matching the repository's CI setup
- Git

### Setup

```bash
git clone https://github.com/kris70lesgo/arch.git
cd arch
npm ci
cp .env.example .env.local
```

Keep the example's `KERYX_NETWORK=arcTestnet` and `NEXT_PUBLIC_KERYX_NETWORK=arcTestnet` values for isolated local development. Add this to `.env.local` to keep payment paths offline:

```dotenv
KERYX_FORCE_OFFLINE=1
```

Start the web app:

```bash
npm run dev
```

Open [http://localhost:3939](http://localhost:3939). With Supabase variables unset, local development uses SQLite. Without an LLM provider key, the app uses its offline fallback; live model calls require a configured provider and may consume credits.

## Optional integrations

Put secret values in the ignored `.env.local` file or the hosting provider's server-side environment. Never commit secrets or expose them through a `NEXT_PUBLIC_*` variable. The Supabase publishable key is public by design; its service-role key must stay server-side.

| Integration | Environment variables | Notes |
| --- | --- | --- |
| Research model | `DEEPSEEK_API_KEY` or `ANTHROPIC_API_KEY` | Enables live model calls. Provider use may consume credits. |
| SERV and Reppo review | `SERV_REASONING_API_KEY`, `SERV_REASONING_MODEL`, `REPPO_EVAL_API_KEY` | Enables the optional evaluation flow. A review sends the public report, citations, and visible reasoning to the configured services and may consume Reppo credits. |
| Supabase database | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Selects the Supabase adapter. Keep the service-role key on the server only. |

See [.env.example](.env.example) for the full configuration reference. Do not use production database credentials, wallet keys, or funded payment accounts in a local development environment.

## Development checks

Run the checks relevant to your change:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The repository's [development workflow](docs/development-workflow.md) describes review and release requirements.

## Storage and deployment

Local SQLite is for development. Production needs a persistent, identity-configured store and the matching server configuration. A serverless function filesystem is not a persistent database. The current Vercel deployment therefore does not support end-to-end research until its backend storage is provisioned.

Production payment and settlement features require separate Arc, Circle, custody, and storage setup. Follow the [deployment guide](docs/deployment-guide.md) and the relevant operator documentation before enabling them. A successful build alone does not qualify a production release.

## Contributing

Bug reports and focused pull requests are welcome. Before contributing:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
2. Check existing issues and describe the problem, expected behavior, and steps to reproduce.
3. Include relevant validation results and preserve third-party notices.
4. Keep API keys, wallet secrets, private user data, and payment records out of issues and commits.

Use the [issue tracker](https://github.com/kris70lesgo/arch/issues) for questions and bug reports. Report security vulnerabilities through [SECURITY.md](SECURITY.md), not a public issue.

## License

This repository does not have a repository-wide license. Public visibility alone does not grant permission to use, modify, or redistribute the project as a whole. See the [licensing scope](docs/licensing.md) before reusing code or contributing material. Some files and components have their own licenses and notices.
