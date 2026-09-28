import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
const MODEL_ROOT = 'models'
const MODEL_SUBPATH = path.join(MODEL_ID, 'onnx', 'model_quantized.onnx')

let pipelinePromise = null
let failureReason = null

function isDirectoryWritable(directory) {
  try {
    fs.accessSync(directory, fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Resolves the models root, which is what `env.localModelPath` expects: the
 * library appends the model id and filename to it itself.
 */
function resolveLocalModelPath() {
  const candidates = [
    path.join(process.cwd(), MODEL_ROOT),
    path.join(process.cwd(), '..', MODEL_ROOT),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, MODEL_SUBPATH))) {
      return candidate.replace(/\\/g, '/').replace(/\/?$/, '/')
    }
  }

  return null
}

/**
 * Loads the local MiniLM pipeline lazily.
 *
 * `@xenova/transformers` is ESM-only, so it must be reached through a dynamic
 * import rather than a static one, and it must stay in serverExternalPackages
 * so onnxruntime-node keeps its real on-disk layout for the native binding.
 *
 * Throws once per instance if the model cannot be loaded, so callers can treat
 * skill extraction as best-effort instead of failing the whole request.
 */
export async function getEmbedder() {
  if (failureReason) throw new Error(failureReason)
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers')

      env.allowLocalModels = true

      const localModelPath = resolveLocalModelPath()
      if (localModelPath) {
        env.localModelPath = localModelPath
      }

      // Vercel bundles are read-only except /tmp, and the library copies the
      // model into its cache directory before use.
      if (process.env.VERCEL || !isDirectoryWritable(env.cacheDir)) {
        const cacheDir = path.join(os.tmpdir(), 'transformers-cache')
        fs.mkdirSync(cacheDir, { recursive: true })
        env.cacheDir = cacheDir
      }

      return pipeline('feature-extraction', MODEL_ID)
    })().catch((err) => {
      pipelinePromise = null
      failureReason = `Local embedder unavailable: ${err?.message || err}`
      throw new Error(failureReason)
    })
  }

  return pipelinePromise
}

/**
 * Mean-pools and normalises a single string into a 384-dimension vector.
 */
export async function embedText(text) {
  const extractor = await getEmbedder()
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

export function isEmbedderUnavailable() {
  return failureReason !== null
}
