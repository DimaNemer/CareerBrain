import fs from 'fs'
import path from 'path'
import { extractTextFromPdf } from '../lib/pdf-parser.js'
import { extractCvData } from '../lib/ai.js'

// Mock env for testing
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test_key'

async function runTest() {
  const sampleDir = path.join(process.cwd(), 'sample-cvs')
  
  if (!fs.existsSync(sampleDir)) {
    console.log(`Please create a directory at ${sampleDir} and add some sample PDFs to test.`)
    return
  }

  const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.pdf'))
  
  if (files.length === 0) {
    console.log('No PDF files found in sample-cvs directory.')
    return
  }

  for (const file of files) {
    console.log(`\n--- Testing ${file} ---`)
    try {
      const buffer = fs.readFileSync(path.join(sampleDir, file))
      
      console.log('Extracting text...')
      const text = await extractTextFromPdf(buffer)
      console.log(`Extracted ${text.length} characters of cleaned text.`)
      
      console.log('Calling AI extraction (mocked if no valid API key)...')
      // Note: This will fail if the test key is 'test_key'. Provide a real key in env to fully test.
      if (process.env.OPENAI_API_KEY === 'test_key') {
        console.log('Skipping actual OpenAI call due to missing real API key.')
        continue
      }
      
      const data = await extractCvData(text)
      console.log('Extraction Result:', JSON.stringify(data, null, 2))
    } catch (err) {
      console.error(`Failed on ${file}:`, err.message)
    }
  }
}

runTest()
