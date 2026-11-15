<h1 align="center">⚡ VramArmor</h1>

<p align="center">
  <b>The Open-Source Local AI Model VRAM & GPU Inference Optimizer</b><br>
  Predict memory requirements, prevent CUDA OOM crashes, and manage Ollama/vLLM VRAM with native Model Context Protocol (MCP) support.
</p>

<p align="center">
  <a href="https://github.com/1nsharma-labs/vramarmor/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/vramarmor"><img src="https://img.shields.io/badge/npm-v1.0.0-blue.svg" alt="npm version"></a>
  <a href="https://github.com/1nsharma-labs/vramarmor/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-green.svg" alt="License"></a>
  <a href="https://1nsharma-labs.github.io/vramarmor/"><img src="https://img.shields.io/badge/Live_Demo-VRAM_Calculator-orange.svg" alt="Live Demo"></a>
  <a href="https://polar.sh/1nsharma-labs"><img src="https://img.shields.io/badge/Sponsor-Polar.sh-purple.svg" alt="Sponsor"></a>
</p>

---

## 🌟 Why VramArmor?

Running open-source models like DeepSeek-R1, Llama 3.3, and Qwen 2.5 locally is incredible—until you hit **CUDA: Out of Memory (OOM)** errors, or your model silently spills into CPU system RAM, dropping token generation speeds from 50 t/s down to an unusable 2 t/s.

**VramArmor** is a zero-runtime-dependency CLI and Node 24 tool that gives you complete visibility into your GPU VRAM, predicts whether a model will fit before you download or load it, and lets AI agents optimize local inference memory via Model Context Protocol (MCP).

* ⚡ **Zero External Dependencies:** Built with native Node 24 ESM and system GPU probes (`nvidia-smi`, Apple Silicon unified memory).
* 🧮 **Pre-Flight VRAM Calculator:** Calculates model weights, KV cache buffers across context sizes (2k to 128k), and CUDA runtime overhead to prevent OOM panics.
* 🛑 **Instant Model Memory Reclaimer:** Directly inspects and offloads idle models from Ollama / vLLM to free VRAM immediately.
* 🔮 **Native Model Context Protocol (MCP) Server:** Equips **Claude Desktop** and **Cursor** to inspect GPU load and choose models that fit your hardware.
* 🚀 **Enterprise Multi-GPU Shard Balancer (BSL 1.1):** Calculates proportional layer offloading across multi-GPU rigs (dual RTX 4090s, A100 clusters).

---

## 🚀 Quick Start

### Installation

```bash
# Run on-demand without installing
npx -y vramarmor help

# Or install globally
npm install -g vramarmor
```

---

## 💻 CLI Commands

### 1. Inspect Live GPU VRAM & Hardware Status
```bash
vramarmor status
```

### 2. Predict VRAM Fit Before Loading
```bash
# Check if DeepSeek-R1 14B fits with 8k context in 4-bit
vramarmor predict deepseek-r1:14b Q4_K_M 8192

# Check if Llama 3 70B fits in your card
vramarmor predict llama3:70b Q4_K_M 4096
```

### 3. List Active Models Loaded in VRAM
```bash
vramarmor models
```

### 4. Offload Idle Models to Free VRAM
```bash
vramarmor unload deepseek-r1:8b
```

---

## 🔮 Model Context Protocol (MCP) Integration

VramArmor provides a native MCP stdio server. Add it to your `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "vramarmor": {
      "command": "npx",
      "args": ["-y", "vramarmor", "mcp"]
    }
  }
}
```

Now Claude Desktop and Cursor can directly execute:
* `vramarmor_gpu_status`: Returns live VRAM metrics, temperature, and utilization.
* `vramarmor_predict_fit`: Checks if an LLM will fit safely in GPU memory.
* `vramarmor_list_models`: Lists models currently in VRAM.
* `vramarmor_free_vram`: Offloads models to reclaim GPU memory.

---

## 💼 Commercial & Enterprise Support

VramArmor follows an **Open-Core** model:
* **Community Core (Apache 2.0):** 100% Free for single-GPU developers, VRAM predictor, Ollama manager, and full MCP server.
* **Enterprise Edition (BSL 1.1):** Includes the **Multi-GPU Balancer** (`ee/cluster/gpuBalancer.js`) for multi-GPU rigs and enterprise clusters with priority SLA.

### Direct Contact & Payment
* **Lead Architect:** **Amit Sharma** ([@1nsharma](https://github.com/1nsharma))
* **Direct Email:** [amitsharma9976@gmail.com](mailto:amitsharma9976@gmail.com)
* **Direct UPI / PhonePe / GPay / Paytm:** `6393741171` (UPI ID: `6393741171@upi`)
* **Global Sponsorship & Cards:** [polar.sh/1nsharma-labs](https://polar.sh/1nsharma-labs) &bull; [github.com/sponsors/1nsharma](https://github.com/sponsors/1nsharma)

---

## 🌐 The 1nsharma Ecosystem

* [**HiveMesh**](https://github.com/1nsharma-labs/hivemesh) — Autonomous Multi-Agent Workspace Orchestration Mesh & Event Blackboard.
* [**DevDaemon**](https://github.com/1nsharma-labs/devdaemon) — Autonomous Terminal Error Interceptor & Workspace Healer.
* [**DroidArmor**](https://github.com/1nsharma-labs/droidarmor) — Autonomous AI Mobile Agent & Fast ADB Automation for Android.
* [**SlashGraph**](https://github.com/1nsharma-labs/slashgraph) — Universal Codebase & System Architecture Intelligence Graph.
* [**TokenArmor**](https://github.com/1nsharma-labs/tokenarmor) — Open-Source AI Gateway & Token FinOps Firewall.
* [**1nsharma/SLASH**](https://github.com/1nsharma/SLASH) — Unified System & Digital Network Intelligence Graph.
* [**1nsharma/Urlmind**](https://github.com/1nsharma/Urlmind) — Understand Anything on the Internet from a Single URL.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/1nsharma"><b>Amit Sharma</b></a> (@1nsharma-labs)
</p>
