# Truss API SDK — Security Audit Report

| Field | Value |
|--------|--------|
| **Component** | `@truss-security/truss-sdk` |
| **Repository path** | `truss-sdk/` |
| **Report date** | 2026-05-01 |
| **Audit type** | Read-only review (source, examples, dependencies, git history, publish surface) |
| **Scope reference** | Prior audit plan: `truss-sdk_security_audit` (Cursor plan) |

---

## Executive summary

This report documents findings from a security review of the Truss API TypeScript SDK. **No credentials, tokens, or hard-coded secrets were found** in tracked source, `env.example`, the lockfile, or git history. **No private or undocumented Truss endpoints are invoked by the SDK**; only documented public HTTP routes are called. The **most consequential risks depend on backend behavior** (FilterQL handling, exposure of optional response fields, and quotas on AI-backed search). Several **low-to-medium maturity items** are listed for SDK hardening (encryption of API base URL preference, retries, telemetry redaction).

---

## Scope

- Package: `@truss-security/truss-sdk` (audit snapshot referenced package version `0.4.0` in `package.json`).
- Included: `src/`, `examples/`, root config and packaging (`package.json`, `tsconfig.json`, `.gitignore`, `env.example`), dependency metadata and git-visible history.

---

## Verdict

1. **Credentials:** No exposed credentials or tokens in current tree or revision history traced for this repo.
2. **Endpoints:** All HTTP paths used match intended public API surfaces; nothing indicates accidental exposure of internal-only routes from the SDK alone.
3. **Primary risk pattern:** Server-side validation and parameterization of FilterQL and response shaping; SDK forwards user-controlled `filterExpression` and documents fields that might be sensitive if returned verbatim by the API.

---

## 1. Credentials and authentication

### Positive findings

- API key is read from environment (`TRUSS_API_KEY`) or collected via masked interactive prompt (`@inquirer/prompts`).
- References: `src/cli.ts` (environment and password prompt); `examples/_shared.ts` (same pattern for examples).
- Key is transmitted as header `x-api-key` only: `src/utils/http.ts`.
- `env.example` uses placeholders only; `.env` is gitignored; published npm `files` field limits published artifacts (`dist/**/*`, `README.md`).

### Recommendations (low severity)

| ID | Topic | Recommendation |
|----|--------|----------------|
| L-1 | `getConfig()` | Redact `apiKey` when exposing configuration (e.g. avoid plaintext in logs serialization). Location: `src/client.ts`. |
| L-2 | Header merge order | Ensure SDK-managed auth headers cannot be overwritten by incidental caller-supplied headers. Location: `src/utils/http.ts` (`buildHeaders`). |
| L-3 | TLS | Prefer rejecting non-`https` `baseUrl` except for localhost-style development URIs. Location: `src/client.ts`. |

---

## 2. API endpoints used by the SDK

The SDK calls only the following endpoints (implemented in `src/services/search.ts`):

| Method | Path |
|--------|------|
| POST | `/search/global` |
| POST | `/search/vector` |
| GET | `/search/similar/{id}` |
| POST | `/product/search` |
| GET | `/product/{id}/stix` |
| POST | `/product/search/stix` |
| POST | `/search/smart` |

These are consistent with documented public capabilities (search, STIX export, similarity, smart/LLM-assisted search).

### Items to verify with the API/backend team

| ID | Concern |
|----|--------|
| M-1 | **`/search/smart` cost:** Confirm per-key quotas or budgets so a compromised key cannot cause uncontrolled LLM spend. |
| M-2 | **`debug` in responses:** Types in `src/types/search.ts` allow `debug.searchParams`; confirm production does not return this to clients. |
| M-3 | **Embeddings in responses:** Types in `src/types/product.ts` include `title_embedding` / `content_embedding`; confirm the API does not return raw vectors to standard SDK consumers (IP sensitivity, bandwidth, model fingerprinting). |

---

## 3. Additional security considerations

### Server-side reliance (medium / depends on backend)

| ID | Description |
|----|--------------|
| M-4 | **FilterQL:** Client-side escaping in `filterAstBuilder.ts` handles quotes for readable FilterQL; raw `filterExpression` strings pass through unchanged. The **backend must** parse and enforce FilterQL safely with full parameterization (especially `LIKE`), not string concatenation into SQL or similar. |

### SDK behavior / hygiene

| ID | Description |
|----|--------------|
| L-4 | **Retries on POST:** `HttpClient` retries on transient errors for all methods including POST. Current POSTs appear read-side; future non-idempotent POSTs could double-apply. Location: `src/utils/http.ts`. |
| L-5 | **Backoff:** No jitter or `Retry-After` handling documented; coordinated retries possible under rate limits. |
| L-6 | **Response size:** Responses are fully buffered as text without an explicit ceiling; rogue or misconfigured endpoints could stress memory (client-side denial-of-resource). |
| L-7 | **`.env` loading:** Duplicate minimal parsers in `src/cli.ts` and `examples/_shared.ts`; consolidate or adopt a maintained loader. |
| L-8 | **Lockfile vs package version:** Align `package-lock.json` declared package version with `package.json` on publish/regenerate cycles. |
| L-9 | **jsep globals:** Binary operators registered on the shared `jsep` instance may interact with other code in the same process that uses `jsep`. Consider isolation strategy if this becomes observable in production bundles. |

### Informational

- **Source maps:** TypeScript emits source maps (`tsconfig.json`); acceptable for open-source but increases recoverability of source from published artifacts.

- **`.gitignore`:** Consider extending with common patterns (e.g. `.env.*`, `*.log`, `coverage/`, `*.tsbuildinfo`, IDE dirs) beyond the minimal current set.

---

## Remediation checklist

Use this checklist to track follow-up work. IDs match the audit plan.

**Server/API verification**

- [ ] M-1: Confirm per-key quotas on `/search/smart`.
- [ ] M-2: Confirm production strips `debug` payload from `/product/search` (or equivalent).
- [ ] M-3: Confirm embeddings are not returned to SDK consumers in production.
- [ ] M-4: Confirm FilterQL is fully parameterized server-side (especially `LIKE`).

**SDK hardening and maintenance**

- [ ] L-1: Redact `apiKey` in `getConfig()` / serialization paths.
- [ ] L-2: Auth headers take precedence over caller overrides in `buildHeaders`.
- [ ] L-3: Enforce HTTPS for `baseUrl` (exceptions for localhost only).
- [ ] L-4: Scope retries to safe methods or add idempotency for future mutations.
- [ ] L-5: Add backoff jitter and honor `Retry-After` where applicable.
- [ ] L-6: Cap maximum response body size in the HTTP client.
- [ ] L-7: Deduplicate or replace custom dotenv parsing.
- [ ] L-8: Regenerate lockfile so version metadata matches `package.json`.
- [ ] L-9: Avoid mutating global `jsep` where feasible.
- [ ] Info: Expand `.gitignore` for ops hygiene.

---

## Suggested prioritization

1. **Backend confirmation** for M-2, M-3, M-4 (and M-1 for operational security).
2. **Quick SDK wins:** L-3 (HTTPS), L-1 (redaction).
3. **HTTP layer:** L-2, L-4, L-5, L-6.
4. **Cleanup:** L-7, L-8, L-9, `.gitignore` improvements.

---

*End of report.*
