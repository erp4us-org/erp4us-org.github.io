---
title: What should a modern ERP look like?
description: Use a short-stock order to discuss what the interface must make explicit.
date: 2026-11-25
author: erp4us
locale: en
slug: what-should-a-modern-erp-look-like
translationKey: modern-erp
categories: [Design]
tags: [ux, inventory]
draft: true
---

A customer orders ten units and only six are available. Should the system reserve the six immediately? Who can decide to ship them? What does the buyer need to see about the four missing units? These are questions about the workflow, not just the appearance of the screen.

[The planned order-to-procurement slice](https://github.com/erp4us-org/erp4us/issues/16) gives us a concrete scenario against which to review proposals. The current local interface only registers and retrieves articles; it does not yet demonstrate the order flow.

The [UI foundation ADR](https://github.com/erp4us-org/erp4us/blob/main/docs/adr/0004-ui-foundation.md) is proposed. Join the [UI discussion](https://github.com/orgs/erp4us-org/discussions/74) with a workflow, the failure states users should see and what should work with a keyboard.
