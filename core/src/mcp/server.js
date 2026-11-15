import readline from 'readline';
import { GpuTelemetry } from '../gpu/telemetry.js';
import { VramPredictor } from '../predictor/vramPredictor.js';
import { OllamaOptimizer } from '../optimizer/ollamaOptimizer.js';

export class VramMcpServer {
  constructor() {
    this.optimizer = new OllamaOptimizer();
  }

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const request = JSON.parse(trimmed);
        const response = await this.handleMessage(request);
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (err) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: `Parse error: ${err.message}` }
        }) + '\n');
      }
    });

    process.stderr.write('⚡ VramArmor MCP Server running on stdio\n');
  }

  async handleMessage(req) {
    const { id, method, params } = req;

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'vramarmor-mcp',
            version: '1.0.0'
          }
        }
      };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'vramarmor_gpu_status',
              description: 'Inspects active GPU hardware (NVIDIA CUDA / Apple Silicon), total VRAM, used VRAM, and free headroom.',
              inputSchema: { type: 'object', properties: {} }
            },
            {
              name: 'vramarmor_predict_fit',
              description: 'Calculates exact VRAM required for a local LLM based on parameter size, quantization, and context tokens to prevent CUDA OOM crashes.',
              inputSchema: {
                type: 'object',
                properties: {
                  model: { type: 'string', description: 'Model name or parameter size (e.g. deepseek-r1:14b, llama3:70b, 32b)' },
                  quantization: { type: 'string', description: 'Quantization level (Q4_K_M, Q5_K_M, Q8_0, FP16)', default: 'Q4_K_M' },
                  context_tokens: { type: 'number', description: 'Context window size in tokens', default: 4096 }
                },
                required: ['model']
              }
            },
            {
              name: 'vramarmor_list_models',
              description: 'Lists all models currently loaded into GPU VRAM via local Ollama or vLLM.',
              inputSchema: { type: 'object', properties: {} }
            },
            {
              name: 'vramarmor_free_vram',
              description: 'Unloads an idle local LLM from VRAM to reclaim memory immediately.',
              inputSchema: {
                type: 'object',
                properties: {
                  model: { type: 'string', description: 'Model name to unload' }
                },
                required: ['model']
              }
            }
          ]
        }
      };
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      try {
        let content = '';

        if (toolName === 'vramarmor_gpu_status') {
          const status = GpuTelemetry.getGpuStatus();
          content = JSON.stringify(status, null, 2);
        } else if (toolName === 'vramarmor_predict_fit') {
          const gpu = GpuTelemetry.getGpuStatus();
          const pred = VramPredictor.predict(
            args.model,
            args.quantization || 'Q4_K_M',
            args.context_tokens || 4096,
            parseFloat(gpu.vramFreeGb || '24.0')
          );
          content = JSON.stringify(pred, null, 2);
        } else if (toolName === 'vramarmor_list_models') {
          const res = await this.optimizer.getRunningModels();
          content = JSON.stringify(res, null, 2);
        } else if (toolName === 'vramarmor_free_vram') {
          const res = await this.optimizer.unloadModel(args.model);
          content = JSON.stringify(res, null, 2);
        } else {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool "${toolName}" not found.` }
          };
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: content }]
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: `Error: ${err.message}` }]
          }
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {}
    };
  }
}
