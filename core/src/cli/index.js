#!/usr/bin/env node
import { GpuTelemetry } from '../gpu/telemetry.js';
import { VramPredictor } from '../predictor/vramPredictor.js';
import { OllamaOptimizer } from '../optimizer/ollamaOptimizer.js';
import { VramMcpServer } from '../mcp/server.js';

const BANNER = `
  __     ______              _                                
  \\ \\   / /  _ \\ __ _ _ __  / \\   _ __ _ __ ___   ___  _ __  
   \\ \\ / /| |_) / _\` | '_ \\ / _ \\ | '__| '_ \` _ \\ / _ \\| '__| 
    \\ V / |  _ < (_| | | | / ___ \\| |  | | | | | | (_) | |    
     \\_/  |_| \\_\\__,_|_| |_/_/   \\_\\_|  |_| |_| |_|\\___/|_|    
                                                              
  The Open-Source Local AI Model VRAM & GPU Inference Optimizer
  Created by Amit Sharma (@1nsharma) • 1nsharma-labs
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const optimizer = new OllamaOptimizer();

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(BANNER);
    console.log(`Usage: vramarmor <command> [options]\n`);
    console.log(`Commands:`);
    console.log(`  status                      Inspect active GPU hardware, VRAM usage & temperature`);
    console.log(`  predict <model> [quant] [ctx] Predict VRAM requirements & prevent CUDA OOM crashes`);
    console.log(`  models                      List active models currently loaded into VRAM`);
    console.log(`  unload <model>              Unload an idle model from VRAM to reclaim GPU memory`);
    console.log(`  mcp                         Launch Model Context Protocol (MCP) server for Claude / Cursor`);
    console.log(`\nExamples:`);
    console.log(`  vramarmor status`);
    console.log(`  vramarmor predict deepseek-r1:14b Q4_K_M 8192`);
    console.log(`  vramarmor predict llama3:70b Q4_K_M 4096`);
    console.log(`  vramarmor models`);
    console.log(`  vramarmor unload deepseek-r1:8b\n`);
    process.exit(0);
  }

  if (command === 'mcp') {
    const server = new VramMcpServer();
    server.start();
    return;
  }

  console.log(BANNER);

  if (command === 'status') {
    const gpu = GpuTelemetry.getGpuStatus();
    console.log(`🎮 GPU Hardware Telemetry:`);
    console.log(`  Device:         ${gpu.name}`);
    console.log(`  Architecture:   ${gpu.type}`);
    console.log(`  Total VRAM:     ${gpu.vramTotalGb} GB`);
    console.log(`  Used VRAM:      ${gpu.vramUsedGb} GB (${gpu.vramUsedPct}%)`);
    console.log(`  Free Headroom:  ${gpu.vramFreeGb} GB`);
    console.log(`  Temperature:    ${gpu.temperatureC}°C`);
    console.log(`  Compute Load:   ${gpu.utilizationPct}%\n`);
  } else if (command === 'predict') {
    const model = args[1];
    if (!model) {
      console.error(`❌ Error: Please specify a model (e.g. vramarmor predict deepseek-r1:14b)`);
      process.exit(1);
    }
    const quant = args[2] || 'Q4_K_M';
    const ctx = parseInt(args[3] || '4096', 10);

    const gpu = GpuTelemetry.getGpuStatus();
    const pred = VramPredictor.predict(model, quant, ctx, parseFloat(gpu.vramFreeGb));

    console.log(`🧮 VRAM Prediction for "${pred.model}":`);
    console.log(`  Parameters:     ${pred.parametersB} Billion`);
    console.log(`  Quantization:   ${pred.quantization}`);
    console.log(`  Context Window: ${pred.contextTokens} tokens`);
    console.log(`  Weights Size:   ${pred.weightsGb} GB`);
    console.log(`  KV Cache Size:  ${pred.kvCacheGb} GB`);
    console.log(`  CUDA Overhead:  ${pred.overheadGb} GB`);
    console.log(`  -----------------------------------------`);
    console.log(`  Total Required: ${pred.totalRequiredGb} GB`);
    console.log(`  Available VRAM: ${pred.availableVramGb} GB (Headroom: ${pred.headroomGb} GB)`);
    console.log(`  Status:         ${pred.status === 'PERFECT_FIT' ? '✅ PERFECT FIT' : pred.status === 'TIGHT_FIT' ? '⚠️ TIGHT FIT' : '❌ OOM / SPILL RISK'}`);
    console.log(`  Assessment:     ${pred.recommendation}\n`);
  } else if (command === 'models') {
    console.log(`🔍 Inspecting local LLM inference engines (Ollama/vLLM)...\n`);
    const res = await optimizer.getRunningModels();
    console.log(`Loaded Models in VRAM (${res.models.length}):`);
    res.models.forEach((m, idx) => {
      console.log(`  [${idx + 1}] ${m.name} | Weights: ${m.sizeGb} GB | VRAM Allocated: ${m.vramGb} GB`);
    });
    console.log('');
  } else if (command === 'unload') {
    const model = args[1];
    if (!model) {
      console.error(`❌ Error: Please specify a model to unload (e.g. vramarmor unload deepseek-r1:8b)`);
      process.exit(1);
    }
    console.log(`⚡ Offloading "${model}" from GPU VRAM...`);
    const res = await optimizer.unloadModel(model);
    console.log(`✅ ${res.message}\n`);
  } else {
    console.error(`Unknown command: "${command}". Run "vramarmor help" for usage.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
