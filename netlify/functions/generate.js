const fetch = require("node-fetch");

// Helper to call OpenAI
async function callOpenAI(prompt, apiKey) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.8
    })
  });

  return resp.json();
}

exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const idea = body.idea || "No idea provided";
    const tone = body.tone || "professional";
    const length = body.length || "short";
    const langCode = body.language || "en";
    const apiKey = process.env.OPENAI_API_KEY;

    // Mapping codes -> full names
    const languageMap = {
      en: "English",
      es: "Spanish",
      fr: "French",
      hi: "Hindi"
    };

    const language = languageMap[langCode.toLowerCase()] || "English";

    // Step 1: Always generate English pitch first
    const englishPrompt = `You are a professional pitch writer. Write a ${length} startup pitch in a ${tone} tone for: ${idea}`;
    let data = await callOpenAI(englishPrompt, apiKey);
    let pitch = data.choices?.[0]?.message?.content || "No output";

    // Step 2: If selected language is NOT English → translate
    if (language !== "English") {
      let transPrompt = `Translate this startup pitch into ${language}. 
      Rules: Use only ${language} script. Do not keep any English words.
      Pitch: ${pitch}`;

      // Special strict rules for Hindi
      if (language === "Hindi") {
        transPrompt = `इस स्टार्टअप पिच को हिंदी (देवनागरी लिपि) में अनुवाद करें। 
        एक भी अंग्रेज़ी शब्द का प्रयोग न करें। 
        पिच: ${pitch}`;
      }

      data = await callOpenAI(transPrompt, apiKey);
      pitch = data.choices?.[0]?.message?.content || "No output (translation failed)";
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result: pitch })
    };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
};
