# Decision log

Short records of choices made and why, newest last.

## D1: Dataset is Banking77
Public, labelled, CC-BY-4.0, widely benchmarked; 77 fine-grained intents with many near-duplicates,
which is where keyword rules break down. Intents map naturally onto ~12 fintech microservices.

## D2: No fine-tuned baseline
Glean already compared JEV against a locally fine-tuned classifier (74.5% vs 66.8% agreement on query
classification) and concluded JEV is most attractive when a task is new or its labels change. We cite
that result instead of reproducing it, and focus on routing, where Glean found JEV strongest.

## D3: Python
Ecosystem for data handling, LLM SDKs and the JEV/LangChain integration.

## D4: Thresholds tuned on train, reported on test
Prevents the hybrid from looking better than it is.

## Open
- LLM baseline model (proposed: a fast, cheap current Claude model).
- JEV API access.
- Final intent → service map.
