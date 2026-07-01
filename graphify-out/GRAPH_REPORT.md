# Graph Report - CareerBrain  (2026-07-01)

## Corpus Check
- 51 files · ~19,390 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 162 nodes · 170 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e27c0a2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 6 edges
2. `extractSkillsWithAI()` - 4 edges
3. `rateLimit()` - 4 edges
4. `POST()` - 3 edges
5. `embedAllSkills()` - 3 edges
6. `getQueue()` - 3 edges
7. `createServiceClient()` - 3 edges
8. `POST()` - 2 edges
9. `POST()` - 2 edges
10. `POST()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `rateLimit()`  [INFERRED]
  app/api/auth/forgot-password/route.js → lib/rate-limit.js
- `POST()` --calls--> `rateLimit()`  [INFERRED]
  app/api/auth/login/route.js → lib/rate-limit.js
- `POST()` --calls--> `rateLimit()`  [INFERRED]
  app/api/auth/signup/route.js → lib/rate-limit.js
- `POST()` --calls--> `extractSkillsWithAI()`  [INFERRED]
  app/api/opportunities/sync/route.js → lib/ai-skills.js
- `POST()` --calls--> `embedAllSkills()`  [INFERRED]
  app/api/opportunities/sync/route.js → lib/embed-skills.js

## Import Cycles
- None detected.

## Communities (22 total, 6 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (3): metadata, colors, theme

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (14): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, name, private, scripts (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (8): POST(), extractSkillsWithAI(), getExtractor(), concurrency, worker, DEFAULT_MASTER_SKILLS, embedAllSkills(), getExtractor()

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (11): dependencies, bullmq, ioredis, lucide-react, next, react, react-dom, sonner (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.31
Nodes (5): POST(), POST(), POST(), attempts, rateLimit()

### Community 10 - "Community 10"
Cohesion: 0.60
Nodes (3): createServiceClient(), DEFAULT_MASTER_SKILLS, run()

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (3): AUTH_ROUTES, config, PROTECTED_ROUTES

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (3): compilerOptions, paths, @/*

### Community 15 - "Community 15"
Cohesion: 0.83
Nodes (3): enqueueOpportunity(), getConnection(), getQueue()

## Knowledge Gaps
- **39 isolated node(s):** `metadata`, `labelStyle`, `inputStyle`, `colors`, `theme` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `rateLimit()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`rateLimit()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `labelStyle`, `inputStyle` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09486166007905138 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._