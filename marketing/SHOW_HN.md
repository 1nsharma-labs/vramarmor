# Show HN: VramArmor – Local LLM VRAM predictor & GPU inference optimizer

Hey Hacker News,

I’m Amit (@1nsharma), founder of 1nsharma-labs. Today I’m releasing **VramArmor** (Apache 2.0).

### The Problem
With DeepSeek-R1, Llama 3.3, and Qwen 2.5 local adoption soaring:
1. **CUDA Out of Memory (OOM) Crashes:** You download a 32B or 70B model only to have your inference engine abort when the context window expands.
2. **Silent System RAM Spills:** If a model doesn't fit in VRAM, it silently spills onto system RAM via unified memory/PCIe, collapsing generation speeds from 50 t/s down to 2 t/s.
3. **No GPU Awareness in AI IDEs:** Cursor and Claude Desktop have no way of knowing whether a proposed local model will fit your hardware.

### What VramArmor Does
VramArmor is a zero-runtime-dependency CLI & MCP tool:
- **Pre-Flight VRAM Calculator:** Calculates model weights, KV cache buffers for context sizes (2k-128k), and CUDA overhead to give you a definitive prediction before loading.
- **Ollama / vLLM Memory Manager:** Lists models currently residing in VRAM and lets you offload idle models in 1 click.
- **Native MCP Server:** Connects directly to Claude Desktop & Cursor.

- **GitHub:** https://github.com/1nsharma-labs/vramarmor
- **Live In-Browser VRAM Calculator:** https://1nsharma-labs.github.io/vramarmor/

I'd love your thoughts, feedback, and PRs!
