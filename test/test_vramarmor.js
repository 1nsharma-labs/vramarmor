import assert from 'assert';
import { GpuTelemetry } from '../core/src/gpu/telemetry.js';
import { VramPredictor } from '../core/src/predictor/vramPredictor.js';
import { OllamaOptimizer } from '../core/src/optimizer/ollamaOptimizer.js';
import { EnterpriseLicenseVerifier } from '../ee/license/verifier.js';
import { MultiGpuBalancer } from '../ee/cluster/gpuBalancer.js';

console.log('🧪 Running VramArmor Test Suite...\n');

// 1. GpuTelemetry Tests
console.log('▶ Testing GpuTelemetry (Hardware VRAM Probing)...');
const gpu = GpuTelemetry.getGpuStatus({ simulate: true });
assert(gpu.name.includes('RTX 4090'), 'GPU name should contain RTX 4090');
assert(parseFloat(gpu.vramTotalGb) === 24.0, 'Total VRAM should be 24GB');
console.log(`  ✔ GPU Telemetry verified: ${gpu.name} (${gpu.vramTotalGb}GB total, ${gpu.vramFreeGb}GB free)`);

// 2. VramPredictor Tests
console.log('\n▶ Testing VramPredictor (Memory & CUDA OOM Estimation)...');

// Scenario A: 14B model in 24GB card -> Should be PERFECT_FIT
const pred14b = VramPredictor.predict('deepseek-r1:14b', 'Q4_K_M', 4096, 24.0);
assert(pred14b.parametersB === 14, 'Param count should be 14');
assert(pred14b.totalRequiredGb < 12.0, '14B Q4 should require < 12GB');
assert(pred14b.status === 'PERFECT_FIT', '14B should fit easily in 24GB');
console.log(`  ✔ 14B Q4 prediction verified: ${pred14b.totalRequiredGb}GB required (${pred14b.status})`);

// Scenario B: 70B model in 24GB card -> Should be OOM_SPILL_RISK
const pred70b = VramPredictor.predict('llama3:70b', 'Q4_K_M', 4096, 24.0);
assert(pred70b.parametersB === 70, 'Param count should be 70');
assert(pred70b.totalRequiredGb > 40.0, '70B Q4 should require > 40GB');
assert(pred70b.status === 'OOM_SPILL_RISK', '70B should exceed 24GB VRAM');
console.log(`  ✔ 70B OOM protection verified: requires ${pred70b.totalRequiredGb}GB -> ${pred70b.status}`);

// 3. OllamaOptimizer Tests
console.log('\n▶ Testing OllamaOptimizer (Local Model Management)...');
const optimizer = new OllamaOptimizer();
const modelsRes = await optimizer.getRunningModels({ simulate: true });
assert(modelsRes.models.length >= 2, 'Should return running models');
console.log(`  ✔ Discovered ${modelsRes.models.length} loaded models in VRAM`);

const unloadRes = await optimizer.unloadModel('deepseek-r1:8b', { simulate: true });
assert(unloadRes.success === true, 'Unload should succeed');
console.log(`  ✔ Model unload action verified: ${unloadRes.message}`);

// 4. Enterprise Edition Tests
console.log('\n▶ Testing Enterprise Edition (Multi-GPU Balancer & Licensing)...');
const sampleKey = EnterpriseLicenseVerifier.generateSampleKey('cluster@corp.internal');
const verif = EnterpriseLicenseVerifier.verifyKey(sampleKey);
assert(verif.valid === true, 'Enterprise license should verify');
console.log(`  ✔ Verified enterprise license for: ${verif.licensee}`);

const balancer = new MultiGpuBalancer(sampleKey);
const sharding = balancer.planModelSharding(42.0, [
  { id: 0, name: 'RTX 4090 #1', freeGb: 23.0 },
  { id: 1, name: 'RTX 4090 #2', freeGb: 23.0 }
]);
assert(sharding.feasible === true, '42GB model should shard across 2x 23GB cards');
assert(sharding.shards.length === 2, 'Should generate 2 shards');
console.log(`  ✔ Multi-GPU sharding verified: ${sharding.shards[0].name} takes ${sharding.shards[0].allocatedGb}GB, ${sharding.shards[1].name} takes ${sharding.shards[1].allocatedGb}GB`);

console.log('\n🎉 ALL VRAMARMOR TESTS PASSED WITH 100% SUCCESS!\n');
