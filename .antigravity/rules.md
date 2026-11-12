# Antigravity Rules — Saijai99

1. Treat `docs/MASTER_PROJECT_SPEC.md` as the architecture contract and `docs/IMPLEMENTATION_ROADMAP.md` as the phase order.
2. Work only in the existing workspace `D:\Saijai99\saijai99long1` and existing GitHub repository `narathipkitchawan-ops/saijai99long1`.
3. Preserve the existing TypeScript + Wrangler v4 + `wrangler.jsonc` stack. Do not migrate to another framework or CLI.
4. Use the existing `staging` branch for development. Do not rename `master`, create a new default branch, or modify production without explicit approval.
5. Make additive, minimal-diff changes. Preserve `GET /health`, `POST /webhook/line`, LINE HMAC signature validation, and existing CI.
6. Never commit secrets or real credentials. Never put `xxx` into deployed configuration as if it were a valid value. Keep `.dev.vars` ignored.
7. Do not invent spreadsheet IDs, Drive IDs, D1 IDs, KV IDs, prices, stock, delivery fees, vendor records, employee records, or customer records.
8. Customer-facing catalog, price, availability, payment, and delivery responses must use verified live data only. If unavailable, tell the customer that the information is not ready and do not accept a dependent transaction.
9. Do not create, delete, migrate, or bind remote Cloudflare/Google resources until the exact resource and impact are verified.
10. No production deploy. Staging deploy only after build, tests, configuration review, and explicit phase acceptance.
11. Treat AI/OCR output as untrusted until validated; require human review for ambiguous payment, invoice, livestock, HR, and payroll data.
12. Add idempotency, audit logging, authorization, validation, privacy controls, and failure handling to transactional workflows.
13. Before changing a file, inspect its current contents. Do not overwrite unrelated user work.
14. Report changed files, tests run, deployment target, and remaining blockers. Never claim a test or deployment succeeded unless its result was observed.
