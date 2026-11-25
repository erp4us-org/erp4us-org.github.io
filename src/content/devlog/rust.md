---
title: Why Rust for enterprise software?
description: What Rust helps express in Master Data and what the type system cannot promise.
date: 2026-11-25
author: erp4us
locale: en
slug: why-rust-for-enterprise-software
translationKey: rust
categories: [Engineering]
tags: [rust, master-data]
draft: true
---

The [Master Data service](https://github.com/erp4us-org/erp4us/tree/main/services) uses Rust, Tokio and Axum. Rust offers a way to make ownership and error cases explicit, but it does not tell us whether our business rules are correct. An SKU can still be assigned the wrong meaning; a transaction can still have the wrong boundary.

## Check behavior at the boundary

The [OpenAPI contract](https://github.com/erp4us-org/erp4us/blob/main/contracts/openapi/master-data-v1.yaml) is what clients integrate against. Compose smoke tests check behavior such as duplicate SKU rejection and persistence after restart. Neither a successful compile nor these checks are a throughput benchmark.

[ADR 0001](https://github.com/erp4us-org/erp4us/blob/main/docs/adr/0001-independent-services.md) deliberately describes independently deployable contexts. The roadmap includes an independent non-Rust example to test whether the protocol is language-neutral in practice.
