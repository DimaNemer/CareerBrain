/**
 * Extracts structured data from raw CV text using Google Gemini API.
 * @param {string} cvText 
 * @returns {Promise<any>}
 */
export async function extractCvData(cvText) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please configure GEMINI_API_KEY in .env.local.')
  }

  const prompt = `You are an expert HR assistant and CV parser. Extract structured information from the following CV text.

Return ONLY a JSON object matching this exact structure (no markdown, no code blocks):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "Phone number",
  "education": [
    { "level": "Bachelor/Master", "university": "University Name", "graduation_year": "YYYY" }
  ],
  "experience": [
    { "role": "Job Title", "company": "Company Name", "years": 2 }
  ],
  "projects": ["Project 1", "Project 2"],
  "certifications": ["Cert 1", "Cert 2"],
  "languages": ["English", "Spanish"],
  "skills": [
    {
      "name": "Skill Name",
      "category": "Technical skills / Communication skills / Soft skills / Language skills / Leadership and management skills / Tools and software / Domain or industry knowledge / Other relevant professional skills",
      "proficiency": "Beginner / Intermediate / Advanced / Expert",
      "proficiencyScore": 25 / 50 / 75 / 100,
      "evidence": "Describe brief specific evidence for this skill from the CV (projects, experiences, studies) or inferred context"
    }
  ],
  "years_of_experience": 2
}

Rules:
1. Output valid JSON only — no markdown, no triple backticks.
2. If a field is not found, use null, empty string, or empty array.
3. "years_of_experience" must be a single integer.
4. "skills" must be an array of objects matching the structure above. Every skill must be categorized into one of the 8 allowed categories exactly.
5. Inferred proficiencies: map clearly based on years of experience, projects, roles, or certifications.

CV Text:
${cvText}`

  // Supported model fallback order
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
  ]

  let lastError = null

  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 4096,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE'
            }
          ]
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        console.error(`Gemini model ${modelName} failed [HTTP ${response.status}]:`, errBody)
        lastError = new Error(`Gemini ${modelName} failed [HTTP ${response.status}]: ${errBody}`)
        continue
      }

      const data = await response.json()
      const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!rawContent) {
        console.error(`Gemini model ${modelName} returned empty candidate content`)
        lastError = new Error(`Gemini ${modelName} returned empty content`)
        continue
      }

      // Locate and extract the JSON object substring cleanly, ignoring any surrounding text/fences
      const startIdx = rawContent.indexOf('{')
      const endIdx = rawContent.lastIndexOf('}')
      
      if (startIdx === -1 || endIdx === -1) {
        console.error(`Gemini model ${modelName} output did not contain a valid JSON object string:`, rawContent)
        lastError = new Error(`Gemini (${modelName}) output did not contain a valid JSON object`)
        continue
      }
      
      const cleaned = rawContent.substring(startIdx, endIdx + 1).trim()

      let parsed
      try {
        parsed = JSON.parse(cleaned)
      } catch (parseErr) {
        console.error(`Failed to parse JSON from Gemini model ${modelName}:`, parseErr.message)
        lastError = new Error(`Failed to parse JSON from Gemini (${modelName}): ${parseErr.message}`)
        continue
      }

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        console.error(`Gemini model ${modelName} returned invalid non-object JSON structure`)
        lastError = new Error(`Gemini (${modelName}) returned invalid JSON structure`)
        continue
      }

      console.log(`[CV Extraction] Successfully processed CV using Gemini model: ${modelName}`)
      return parsed
    } catch (err) {
      lastError = err
      console.error(`Error executing request with model ${modelName}:`, err.message)
    }
  }

  throw lastError || new Error('All Gemini models failed.')
}
