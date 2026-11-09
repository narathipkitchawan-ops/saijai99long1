# Saijai 99 — LINE Webhook Worker

Cloudflare Worker scaffold for the Saijai 99 LINE Official Account integration.

## Environments

- Staging Worker: `saijai99long1-staging`
- Production Worker: `saijai99long1-production` (configured separately; not deployed)

## Requirements

- Node.js 20+
- npm
- Cloudflare account with Workers access
- LINE Messaging API channel secret

## Setup

```bash
npm install
npm run build
```

Set the LINE channel secret as a Worker secret. Never commit it:

```bash
npx wrangler secret put LINE_CHANNEL_SECRET --env staging
```

## Local development

```bash
npm run dev
```

## Staging deployment

```bash
npm run deploy:staging
```

Production deployment is intentionally separate and must not run until staging tests pass and a release is approved.

## Endpoints

- `GET /health` — health check
- `POST /webhook/line` — validates the LINE `x-line-signature` HMAC-SHA256 header and acknowledges the event payload

This initial scaffold does not store customer data, create orders, send customer replies, or expose placeholder product prices, stock, or delivery fees.
