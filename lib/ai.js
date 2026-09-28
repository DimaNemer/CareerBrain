/**
 * Extracts structured data from raw CV text using Google Gemini API.
 * @param {string} cvText
 * @returns {Promise<any>}
 */
export async function extractCvData(cvText) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      'Gemini API Key is missing. Please configure GEMINI_API_KEY.'
    )
  }

  if (
    typeof cvText !== 'string' ||
    !cvText.trim()
  ) {
    throw new Error(
      'CV text is empty and cannot be analyzed.'
    )
  }

  const prompt = `You are an expert HR assistant and CV parser. Extract structured information from the following CV text.

Return ONLY a JSON object matching this exact structure (no markdown, no code blocks):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "Phone number",
  "education": [
    {
      "level": "Bachelor/Master",
      "university": "University Name",
      "graduation_year": "YYYY"
    }
  ],
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "years": 2
    }
  ],
  "projects": ["Project 1", "Project 2"],
  "certifications": ["Cert 1", "Cert 2"],
  "languages": ["English", "Spanish"],
  "skills": [
    {
      "name": "Skill Name",
      "category": "Technical skills / Communication skills / Soft skills / Language skills / Leadership and management skills / Tools and software / Domain or industry knowledge / Other relevant professional skills",
      "proficiency": "Beginner / Intermediate / Advanced / Expert",
      "proficiencyScore": 25,
      "evidence": "Brief specific evidence for this skill from the CV"
    }
  ],
  "years_of_experience": 2
}

Rules:
1. Output valid JSON only.
2. Do not use markdown or triple backticks.
3. If a field is not found, use null, an empty string, or an empty array.
4. "years_of_experience" must be a single integer.
5. "skills" must be an array of objects matching the structure above.
6. Every skill must use exactly one of these categories:
   - Technical skills
   - Communication skills
   - Soft skills
   - Language skills
   - Leadership and management skills
   - Tools and software
   - Domain or industry knowledge
   - Other relevant professional skills
7. "proficiency" must be one of:
   - Beginner
   - Intermediate
   - Advanced
   - Expert
8. "proficiencyScore" must be one of:
   - 25
   - 50
   - 75
   - 100
9. Infer proficiency carefully from experience, projects, responsibilities, education, and certifications.

CV Text:
${cvText}`

  /*
   * Current Gemini fallback order.
   *
   * 3.8 Flash is the primary model.
   * 3.5 Flash-Lite gives us a cheaper/faster fallback.
   * 3.6 and 3.5 Flash provide additional redundancy.
   */
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
  ]

  const retryableStatusCodes = [
    429,
    500,
    502,
    503,
    504,
  ]

  const maxAttemptsPerModel = 2

  let lastError = null

  function sleep(ms) {
    return new Promise(resolve =>
      setTimeout(resolve, ms)
    )
  }

  for (const modelName of modelsToTry) {
    for (
      let attempt = 1;
      attempt <= maxAttemptsPerModel;
      attempt += 1
    ) {
      try {
        const url =
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

        console.log(
          `[CV Extraction] Trying ${modelName}, attempt ${attempt}/${maxAttemptsPerModel}`
        )

        const response = await fetch(url, {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'x-goog-api-key':
              apiKey,
          },

          body: JSON.stringify({
            contents: [
              {
                role: 'user',

                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],

            generationConfig: {
              temperature: 0.1,
              topP: 0.8,
              maxOutputTokens: 4096,

              /*
               * Ask Gemini explicitly for JSON.
               */
              responseMimeType:
                'application/json',
            },

            safetySettings: [
              {
                category:
                  'HARM_CATEGORY_HARASSMENT',
                threshold:
                  'BLOCK_NONE',
              },

              {
                category:
                  'HARM_CATEGORY_HATE_SPEECH',
                threshold:
                  'BLOCK_NONE',
              },

              {
                category:
                  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold:
                  'BLOCK_NONE',
              },

              {
                category:
                  'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold:
                  'BLOCK_NONE',
              },
            ],
          }),
        })

        if (!response.ok) {
          const responseText =
            await response.text()

          console.error(
            `[CV Extraction] ${modelName} failed on attempt ${attempt} with HTTP ${response.status}:`,
            responseText
          )

          lastError = new Error(
            `Gemini ${modelName} failed with HTTP ${response.status}`
          )

          const canRetry =
            retryableStatusCodes.includes(
              response.status
            )

          if (
            canRetry &&
            attempt <
              maxAttemptsPerModel
          ) {
            const retryDelay =
              attempt * 1500

            console.log(
              `[CV Extraction] Retrying ${modelName} in ${retryDelay}ms`
            )

            await sleep(retryDelay)

            continue
          }

          /*
           * Stop retrying this model.
           * The outer loop will try the next model.
           */
          break
        }

        const data =
          await response.json()

        const rawContent =
          data?.candidates?.[0]
            ?.content?.parts
            ?.map(part => part?.text || '')
            .join('')
            .trim()

        if (!rawContent) {
          console.error(
            `[CV Extraction] ${modelName} returned no text content.`,
            data
          )

          lastError = new Error(
            `Gemini ${modelName} returned empty content`
          )

          /*
           * An empty response is unlikely to improve
           * by retrying the exact same model immediately.
           */
          break
        }

        /*
         * responseMimeType requests JSON,
         * but we still defensively locate the object.
         */
        const startIdx =
          rawContent.indexOf('{')

        const endIdx =
          rawContent.lastIndexOf('}')

        if (
          startIdx === -1 ||
          endIdx === -1 ||
          endIdx < startIdx
        ) {
          console.error(
            `[CV Extraction] ${modelName} did not return a JSON object:`,
            rawContent
          )

          lastError = new Error(
            `Gemini ${modelName} returned invalid JSON content`
          )

          break
        }

        const cleaned =
          rawContent
            .substring(
              startIdx,
              endIdx + 1
            )
            .trim()

        let parsed

        try {
          parsed =
            JSON.parse(cleaned)
        } catch (parseError) {
          console.error(
            `[CV Extraction] Failed to parse JSON from ${modelName}:`,
            parseError
          )

          lastError = new Error(
            `Gemini ${modelName} returned malformed JSON`
          )

          break
        }

        if (
          !parsed ||
          typeof parsed !==
            'object' ||
          Array.isArray(parsed)
        ) {
          console.error(
            `[CV Extraction] ${modelName} returned an invalid JSON structure.`,
            parsed
          )

          lastError = new Error(
            `Gemini ${modelName} returned an invalid JSON structure`
          )

          break
        }

        console.log(
          `[CV Extraction] Successfully processed CV using ${modelName}`
        )

        return parsed
      } catch (error) {
        lastError = error

        console.error(
          `[CV Extraction] Request error for ${modelName}, attempt ${attempt}:`,
          error
        )

        if (
          attempt <
          maxAttemptsPerModel
        ) {
          const retryDelay =
            attempt * 1500

          await sleep(retryDelay)

          continue
        }

        break
      }
    }
  }

  console.error(
    '[CV Extraction] All Gemini models failed:',
    lastError
  )

  throw new Error(
    'AI CV analysis is temporarily unavailable. Please try again shortly.'
  )
}