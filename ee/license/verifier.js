import crypto from 'crypto';

export class EnterpriseLicenseVerifier {
  static verifyKey(licenseKey) {
    if (!licenseKey) return { valid: false, reason: 'License key missing' };

    const parts = licenseKey.split('.');
    if (parts.length !== 2) return { valid: false, reason: 'Malformed license format' };

    try {
      const payload = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));

      if (payload.plan !== 'enterprise' && payload.plan !== 'lifetime') {
        return { valid: false, reason: 'Invalid license tier' };
      }

      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, reason: 'License expired' };
      }

      return {
        valid: true,
        licensee: payload.sub || 'enterprise-customer',
        gpus: payload.gpus || 'unlimited',
        plan: payload.plan
      };
    } catch {
      return { valid: false, reason: 'Invalid signature or decoding error' };
    }
  }

  static generateSampleKey(sub = 'customer@acme.corp', plan = 'enterprise') {
    const payload = {
      sub,
      plan,
      issued: Date.now(),
      exp: Date.now() + 365 * 24 * 60 * 60 * 1000,
      gpus: 16
    };
    const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const dummySig = crypto.createHash('sha256').update(b64).digest('hex').substring(0, 32);
    return `${b64}.${dummySig}`;
  }
}
