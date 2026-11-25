---
title: How humans and AI agents can build enterprise software together
description: Separate how we develop erp4us from what future product integrations might allow.
date: 2026-11-25
author: erp4us
locale: en
slug: how-humans-and-ai-agents-can-build-enterprise-software-together
translationKey: humans-and-agents
categories: [Community]
tags: [review, ai, mcp]
draft: true
---

Start with a small issue and explicit acceptance criteria. Repository-specific [AGENTS.md](https://github.com/erp4us-org/erp4us/blob/main/AGENTS.md) instructions give coding agents a boundary, but it is a human's job to decide whether a change matches the business rules. Tests and CI establish evidence for review; they do not grant approval. Contributors do not need to use AI.

## Product integration is a separate question

The [semantic contracts ADR](https://github.com/erp4us-org/erp4us/blob/main/docs/adr/0003-semantic-contracts.md) accepts a draft description format, not a stable MCP implementation. A future agent gateway should use the same authorized operations as a person. Submit scenarios and approval boundaries in the [open integration discussion](https://github.com/orgs/erp4us-org/discussions/76).
