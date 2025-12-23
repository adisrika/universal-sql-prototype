# Universal SQL Prototype (Cross-Connector Query Engine)

## Overview

This project is a **thin-slice prototype** of a Universal SQL query engine that enables querying across multiple SaaS data sources (e.g., GitHub, Jira) using a single SQL interface.

The goal of the prototype is **not** to build a full SQL engine, but to demonstrate:

- Clean separation of **control plane** and **data plane**
- Easy onboarding of new connectors
- Cross-source query execution and joins
- Policy enforcement (RLS / CLS)
- Rate limiting and isolation
- Freshness-aware caching
- Observability and load testing
- Extensibility toward a production-grade architecture
