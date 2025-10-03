const fetch = require("node-fetch");

exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const idea = body.idea || "No idea provided";
    const tone = body.tone || "professional";
    const length = body.length || "short";
    const language = body.language || "English";

    // Default prompt
    let prompt = `You are a professional pitch writer. Write a ${length} startup pitch in a ${tone} tone. 
The pitch must be strictly written in ${language}. 
Startup idea: ${idea}`;

    // Special strict handling for Hindi
    if (language.toLowerCase() === "hindi") {
      prompt = `आप एक पेशेवर पिच लेखक हैं। ${tone} शैली में ${length} लंबाई की एक स्टार्टअप पिच लिखें। 
उत्तर केवल हिंदी (देवनागरी लिपि) में दें, अंग्रेज़ी का उपयोग बिल्कुल न करें। 
स्टार्टअप आइडिया: ${idea}`;
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.8
      })
    });

    const data = await resp.json();
    const result = data.choices?.[0]?.message?.content || "No output";

    // Optional auto-check: if Hindi is requested but English comes back
    if (language.toLowerCase() === "hindi" && /[a-zA-Z]/.test(result)) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          result: "⚠️ Error: Model returned English. Please retry."
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
};
