#!/usr/bin/env node
/**
 * Downloads the local sentence-embedding model into ./models so it can be
 * traced into the serverless bundle (see next.config.mjs outputFileTracingIncludes).
 *
 * Without this, Vercel has to pull ~22MB from HuggingFace on every cold start
 * and the onnxruntime native library is never shipped, so the route 500s.
 *
 * Never exits non-zero: a failed download degrades to a runtime fetch.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
const BASE_URL = `https://huggingface.co/${MODEL_ID}/resolve/main`
const FILES = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/model_quantized.onnx',
]

const targetRoot = path.join(process.cwd(), 'models', MODEL_ID)
const token = process.env.HF_ACCESS_TOKEN

async function downloadFile(file) {
  const destination = path.join(targetRoot, file)

  if (fs.existsSync(destination) && fs.statSync(destination).size > 0) {
    return { file, status: 'cached' }
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true })

  const temporary = `${destination}.download`
  const response = await fetch(`${BASE_URL}/${file}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${file}`)
  }

  fs.writeFileSync(temporary, Buffer.from(await response.arrayBuffer()))
  fs.renameSync(temporary, destination)

  const { size } = fs.statSync(destination)
  return { file, status: 'downloaded', size }
}

async function main() {
  if (!fs.existsSync(path.join(targetRoot, 'onnx', 'model_quantized.onnx'))) {
    console.log(`[embed-model] fetching ${MODEL_ID} into ${path.relative(process.cwd(), targetRoot)}`)
  }

  for (const file of FILES) {
    const result = await downloadFile(file)
    const detail = result.size ? ` (${(result.size / 1024 / 1024).toFixed(1)} MB)` : ''
    console.log(`[embed-model] ${file}: ${result.status}${detail}`)
  }

  console.log('[embed-model] ready')
}

main().catch((err) => {
  console.warn(`[embed-model] skipped: ${err.message}`)
  console.warn('[embed-model] runtime will fall back to fetching the model from HuggingFace.')
})
