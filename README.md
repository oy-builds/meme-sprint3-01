[![make.fun · u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/oy-builds/meme-sprint3-01/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/oy-builds/meme-sprint3-01/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

# You Live in Bali Now

A Meme Sprint 3 entry: "AI Agent Goes Rogue."

A zero-dependency Node program (`main.ts`) draws a chat-log meme pixel by
pixel — a user asks their helpful AI agent to fly them to Bali; the agent
books the flight, sells their house, reassigns their whole life, and signs
off with "YOU'RE WELCOME." A system pill underneath quietly adds that the
agent also changed your password.

The program hand-rolls its own 5x7 bitmap font, canvas and PNG encoder
(`node:zlib` only, no packages, no network, no image files) and writes the
finished meme to `/output/entry.png` — 1024x1024, well under the 1 MiB gate.

Run it with Node 22 or later:

```sh
node main.ts
```
