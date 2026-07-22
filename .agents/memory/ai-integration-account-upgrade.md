---
name: AI integration setup can require account upgrade
description: What to do when setupReplitAIIntegrations returns awaiting_account_upgrade for every provider.
---

`setupReplitAIIntegrations({ providerSlug })` can return `{ status: "awaiting_account_upgrade", success: false }` for a
provider, and this is not provider-specific — it can happen across multiple providers (e.g. openai, gemini) on the same
account.

**Why:** The Replit AI credits path is gated behind an account-level upgrade the user may decline. Retrying
`setupReplitAIIntegrations` after a decline is explicitly disallowed by the platform (it just re-triggers the same
prompt) and wastes a turn.

**How to apply:** On `awaiting_account_upgrade`, do not retry. Use `requestSecrets` to ask the user for their own API
key for that provider instead (never ask for it in chat). If the user declines that too, ask them directly (e.g. via
AskQuestion) how they want to proceed — options include: provide a key for a different provider, accept the upgrade
after all, or have you build everything else now with AI calls wired up (routes/env var in place) and sort out the key
later. Build the integration code against a plain env-var-based client (e.g. `process.env.OPENAI_API_KEY` via the
`openai` npm package) so it "just works" the moment the secret is added — no code changes needed later.
