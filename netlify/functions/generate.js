exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const idea = body.idea || "No idea provided";
    const tone = body.tone || "professional";
    const length = body.length || "short";
    const language = body.language || "English";

    // Prompt me language add kar diya
    const prompt = `Write a ${length} startup pitch in a ${tone} tone in ${language} language for: ${idea}`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300
      })
    });

    const data = await resp.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ result: data.choices?.[0]?.message?.content || "No output" })
    };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
};
