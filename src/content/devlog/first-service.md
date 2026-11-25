---
title: Building our first working microservice
description: What the local Master Data slice can demonstrate with synthetic records.
date: 2026-11-25
author: erp4us
locale: en
slug: building-our-first-working-microservice
translationKey: first-service
categories: [Engineering]
tags: [compose, master-data]
draft: true
---

The first working slice answers a deliberately narrow question: can a person register an article and retrieve it after the service restarts? The current app supports this through a local HTTP API and an Angular workspace backed by MongoDB.

## Read the smoke test

The [application quickstart](https://github.com/erp4us-org/erp4us#run-the-first-slice) uses this sequence in a disposable local environment:

```sh
sh scripts/init-dev.sh
docker compose up --build -d
python3 tests/integration/smoke.py --restart
```

This is a development demonstration with synthetic data. It does not provide real tenant authentication or a production operating procedure. If the setup is unclear, [report one friction point](https://github.com/erp4us-org/erp4us/issues/36).
