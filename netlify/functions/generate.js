const fetch = require("node-fetch");

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
    const language = body.language || "English";
    const apiKey = process.env.OPENAI_API_KEY;

    let prompt = `You are a professional pitch writer. Write a ${length} startup pitch in a ${tone} tone. 
The pitch must be strictly written in ${language}. 
Startup idea: ${idea}`;

    // Special strict prompt for Hindi
    if (language.toLowerCase() === "hindi") {
      prompt = `आप एक पेशेवर पिच लेखक हैं। ${tone} शैली में ${length} लंबाई की एक स्टार्टअप पिच लिखें। 
उत्तर केवल हिंदी (देवनागरी लिपि) में दें, अंग्रेज़ी का उपयोग बिल्कुल न करें। 
स्टार्टअप आइडिया: ${idea}`;
    }

    // First API call
    let data = await callOpenAI(prompt, apiKey);
    let result = data.choices?.[0]?.message?.content || "No output";

    // If Hindi selected but English letters detected, auto-retry with ultra strict prompt
    if (language.toLowerCase() === "hindi" && /[a-zA-Z]/.test(result)) {
      const retryPrompt = `आप एक पेशेवर लेखक हैं। 
सिर्फ हिंदी (देवनागरी लिपि) में स्टार्टअप पिच लिखें। 
एक भी अंग्रेज़ी शब्द का प्रयोग न करें। 
आइडिया: ${idea}`;

      data = await callOpenAI(retryPrompt, apiKey);
      result = data.choices?.[0]?.message?.content || "No output (retry failed)";
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
};
