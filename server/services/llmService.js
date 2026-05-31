const axios = require('axios');

// Real LLM response using Gemini API
const getRealLLMResponse = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Set GEMINI_API_KEY or LLM_API_KEY for real Gemini responses.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const headers = {
    'Content-Type': 'application/json'
  };

  const isBearerToken = /^Bearer\s+/i.test(apiKey) || /^ya29\./.test(apiKey);
  if (isBearerToken) {
    headers.Authorization = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
  } else {
    headers['x-goog-api-key'] = apiKey;
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `You are a helpful customer support assistant. Respond concisely and politely to the user's message.\nUser: ${message}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
      maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '1024', 10),
      candidateCount: 1
    }
  };

  const candidateUrls = [];
  if (process.env.GEMINI_API_URL) {
    candidateUrls.push(process.env.GEMINI_API_URL);
  }

  const baseHost = process.env.GEMINI_API_HOST;
  if (!baseHost) {
    throw new Error('GEMINI_API_HOST must be set in environment and cannot be hard-coded.');
  }

  const normalizedBaseHost = baseHost.replace(/\/$/, '');
  const modelPath = normalizedBaseHost.endsWith('/models')
    ? `${normalizedBaseHost}/${model}`
    : `${normalizedBaseHost}/models/${model}`;

  candidateUrls.push(`${modelPath}:generateContent`);
  candidateUrls.push(`${modelPath}:streamGenerateContent`);

  let lastErrorMessage = '';
  for (const url of candidateUrls) {
    try {
      const response = await axios.post(url, payload, { headers, timeout: 15000 });
      const responseBody = response.data;
      const candidate = responseBody?.candidates?.[0];
      const content = candidate?.content;
      const parts = Array.isArray(content?.parts) ? content.parts : null;
      const generatedText = (parts ? parts.map(part => part?.text || '').join('') : '')
        || candidate?.output?.[0]?.content
        || content?.text
        || responseBody?.text
        || '';

      if (!generatedText) {
        throw new Error('Empty Gemini API response');
      }

      const finishReason = candidate?.finishReason || responseBody?.finishReason || 'UNKNOWN';
      console.log(`Gemini API succeeded using endpoint: ${url}`);
      console.log(`Gemini response length=${generatedText.length} finishReason=${finishReason}`);
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Gemini candidate stopped at MAX_TOKENS; consider increasing GEMINI_MAX_OUTPUT_TOKENS');
      }

      return generatedText;
    } catch (error) {
      const responseData = error.response?.data;
      const messageText = error.response?.status
        ? `${error.response.status} ${JSON.stringify(responseData).slice(0, 200)}`
        : error.message;
      lastErrorMessage = messageText;
      console.warn(`Gemini endpoint failed: ${url} -> ${messageText}`);
    }
  }

  console.error('Gemini LLM Error: All candidate endpoints failed.');
  throw new Error(`All Gemini endpoints failed. ${lastErrorMessage || 'Check GEMINI_API_URL / GEMINI_API_HOST and API key configuration.'}`);
};

module.exports = {
  getRealLLMResponse
};
