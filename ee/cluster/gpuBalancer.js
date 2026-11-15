import { EnterpriseLicenseVerifier } from '../license/verifier.js';

export class MultiGpuBalancer {
  constructor(licenseKey) {
    this.verification = EnterpriseLicenseVerifier.verifyKey(licenseKey);
    if (!this.verification.valid) {
      throw new Error(`Enterprise License required for Multi-GPU Balancer: ${this.verification.reason}`);
    }
  }

  planModelSharding(totalModelGb, gpuList = []) {
    const gpus = gpuList.length > 0 ? gpuList : [
      { id: 0, name: 'GPU 0', freeGb: 22.0 },
      { id: 1, name: 'GPU 1', freeGb: 22.0 }
    ];

    const totalAvailable = gpus.reduce((sum, g) => sum + g.freeGb, 0);
    if (totalModelGb > totalAvailable) {
      return {
        feasible: false,
        totalModelGb,
        totalAvailableVramGb: totalAvailable,
        reason: 'Model exceeds total combined VRAM across all GPUs'
      };
    }

    // Proportional sharding
    const shards = gpus.map(g => {
      const sharePct = g.freeGb / totalAvailable;
      const allocatedGb = parseFloat((totalModelGb * sharePct).toFixed(2));
      return {
        gpuId: g.id,
        name: g.name,
        allocatedGb,
        remainingVramGb: parseFloat((g.freeGb - allocatedGb).toFixed(2))
      };
    });

    return {
      feasible: true,
      totalModelGb,
      totalAvailableVramGb: totalAvailable,
      shards
    };
  }
}
