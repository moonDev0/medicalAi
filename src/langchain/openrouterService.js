import { ChatOpenAI } from "@langchain/openai";

// export const getLLMResponse = async (prompt) => {
//   const model = new ChatOpenAI({
//     openAIApiKey:'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',
//     configuration: {
//       baseURL: "https://openrouter.ai/api/v1",
//     },
//     modelName: "mistralai/mistral-7b-instruct",
//     temperature: 0.7,
//   });

//   const res = await model.invoke(prompt);
//   return res.content;
// };

export const getLLMResponse = async (prompt) => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${'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'}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // for free-tier required headers
        "X-Title": "langchain-openrouter-chatbot"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }],
      }),
    });
  
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response";
  };
  