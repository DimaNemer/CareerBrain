import { extractText } from 'unpdf'

/**
 * Cleans extracted text by removing duplicate spaces, empty lines, and invisible characters.
 * @param {string} text
 * @returns {string}
 */
export function cleanExtractedText(text) {
  if (!text) return ''

  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/ +/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

/**
 * Extracts raw text from a PDF Buffer.
 * @param {Buffer} pdfBuffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(pdfBuffer) {
  try {
    // Force a completely fresh Uint8Array with no shared memory
    // This is the only reliable way to satisfy unpdf's strict type check
    const uint8Array = new Uint8Array(
      Array.from(
        Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer)
      )
    )

    const { text } = await extractText(uint8Array, { mergePages: true })

    return cleanExtractedText(text || '')
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to extract text from the PDF file: ${reason}`)
  }
}