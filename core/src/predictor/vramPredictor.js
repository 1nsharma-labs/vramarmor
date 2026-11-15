export class VramPredictor {
  static getQuantMultiplier(quant) {
    const q = (quant || 'Q4_K_M').toUpperCase();
    const map = {
      'FP16': 2.0,
      'Q8_0': 1.15,
      'Q6_K': 0.85,
      'Q5_K_M': 0.73,
      'Q5_0': 0.72,
      'Q4_K_M': 0.58,
      'Q4_0': 0.55,
      'Q3_K_M': 0.45,
      'Q2_K': 0.35
    };
    return map[q] || 0.58;
  }

  static parseParamCount(modelString) {
    const lower = (modelString || '').toLowerCase();
    const match = lower.match(/(\d+)b/);
    if (match) return parseInt(match[1], 10);

    // Common standard models
    if (lower.includes('deepseek-r1:70b') || lower.includes('llama3:70b')) return 70;
    if (lower.includes('deepseek-r1:32b') || lower.includes('qwen2.5:32b')) return 32;
    if (lower.includes('deepseek-r1:14b') || lower.includes('qwen2.5:14b')) return 14;
    if (lower.includes('deepseek-r1:8b') || lower.includes('llama3:8b')) return 8;
    if (lower.includes('deepseek-r1:7b') || lower.includes('qwen2.5:7b')) return 7;
    if (lower.includes('phi-4') || lower.includes('phi4')) return 14;
    if (lower.includes('phi-3') || lower.includes('phi3')) return 3.8;
    if (lower.includes('gemma2:9b')) return 9;
    if (lower.includes('gemma2:27b')) return 27;

    return 7; // Default baseline 7B
  }

  static predict(modelString, quant = 'Q4_K_M', contextTokens = 4096, availableVramGb = 24.0) {
    const paramsB = this.parseParamCount(modelString);
    const multiplier = this.getQuantMultiplier(quant);

    // 1. Weights Memory
    const weightsGb = paramsB * multiplier;

    // 2. KV Cache Memory (approx 0.12MB per token for 70B, 0.05MB for 14B, 0.02MB for 7B)
    const kvPerTokenMb = (paramsB / 70) * 0.12;
    const kvCacheGb = (contextTokens * Math.max(0.015, kvPerTokenMb)) / 1024;

    // 3. CUDA context & overhead buffer
    const overheadGb = 1.2;

    const totalRequiredGb = parseFloat((weightsGb + kvCacheGb + overheadGb).toFixed(2));
    const available = parseFloat(availableVramGb);
    const headroomGb = parseFloat((available - totalRequiredGb).toFixed(2));

    let status = 'PERFECT_FIT';
    let recommendation = 'Model will run 100% in VRAM with high token generation speeds (> 40 t/s).';

    if (headroomGb < 0) {
      status = 'OOM_SPILL_RISK';
      const spillGb = Math.abs(headroomGb);
      recommendation = `Will exceed VRAM by ${spillGb} GB! Model will spill into CPU system RAM, causing extreme latency degradation (~2-5 t/s). Recommendation: Use 4-bit quantization or offload layers.`;
    } else if (headroomGb < 1.5) {
      status = 'TIGHT_FIT';
      recommendation = 'Fits in VRAM with minimal buffer (< 1.5GB). Avoid increasing context window or running concurrent requests.';
    }

    return {
      model: modelString,
      parametersB: paramsB,
      quantization: quant,
      contextTokens,
      weightsGb: parseFloat(weightsGb.toFixed(2)),
      kvCacheGb: parseFloat(kvCacheGb.toFixed(2)),
      overheadGb,
      totalRequiredGb,
      availableVramGb: available,
      headroomGb,
      status,
      recommendation
    };
  }
}
