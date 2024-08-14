// openaiApi.js
const OpenAI =require("openai");
const api_key=process.env.OPENAI_API_KEY;
const openai=new OpenAI.OpenAI({
    baseURL:'https://api.openai-proxy.org/v1',
    apiKey:process.env.OPENAI_API_KEY,
})
//const openai = new OpenAI();

async function callOpenAiAPI(messages, model = "gpt-4-turbo") {
  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: model,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

module.exports = { callOpenAiAPI };