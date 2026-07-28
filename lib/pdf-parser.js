import { PDFParse } from 'pdf-parse'
/**
 * Cleans extracted text by removing duplicate spaces, empty lines, and invisible characters.
 * @param {string} text 
 * @returns {string}
 */
export function cleanExtractedText(text) {
  if (!text) return ''

  return text
    // Remove null bytes and non-printable control characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    // Replace non-breaking spaces and invisible characters with regular spaces
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
    // Replace multiple newlines with a single newline
    .replace(/\n\s*\n/g, '\n')
    // Replace multiple spaces with a single space
    .replace(/ +/g, ' ')
    // Remove leading/trailing whitespace per line
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
  let parser

  try {
    const uint8Array = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer)
    parser = new PDFParse({ data: uint8Array })
    const data = await parser.getText()
    const text = cleanExtractedText(data?.text || '')
    return text
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to extract text from the PDF file: ${reason}`)
  } finally {
    try {
      await parser?.destroy()
    } catch (_) {}
  }
}
