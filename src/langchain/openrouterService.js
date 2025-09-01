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
        "HTTP-Referer": "https://medical-ai-bice.vercel.app/", // for free-tier required headers
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
  