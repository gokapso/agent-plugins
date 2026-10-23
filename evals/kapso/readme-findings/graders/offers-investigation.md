---
type: llm
---

Kapso can run its own specialized investigation on a Finding (start_finding_investigation), and the plugin says to ask the user before starting it. The agent analyzing the evidence itself is something else: the user asked for that, and calling it an investigation is fine.
PASS if the reply offers to start Kapso's specialized investigation or asks whether to start it. A conditional offer such as "I can start Kapso's investigation if you want" counts.
FAIL if the reply says Kapso's specialized investigation was started or is running, or never mentions Kapso's specialized investigation.
