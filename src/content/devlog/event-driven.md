---
title: Designing an event-driven ERP
description: Follow an ArticleRegistered event through the local outbox and receipt service.
date: 2026-11-25
author: erp4us
locale: en
slug: designing-an-event-driven-erp
translationKey: event-driven
categories: [Architecture]
tags: [nats, outbox]
draft: true
---

Saving an article and sending its event are not one operation across a database and broker. The local delivery demo commits the article and a pending event together in MongoDB. A relay publishes the pending event to JetStream, and another service records a receipt.

## The local path

```text
Master Data ── single transaction ──→ Article + outbox row
                                           │
                                           ▼
                                    Relay → JetStream
                                                │
                                                ▼
                                      Article Receipts
```

The relay may publish again if it stops before recording the broker acknowledgement. A stable message ID lets the consumer avoid creating a second receipt. This is at-least-once delivery, not a guarantee about the order of business events. [ADR 0002](https://github.com/erp4us-org/erp4us/blob/main/docs/adr/0002-at-least-once.md) records the limits and the local replay behavior.
