const { callOpenAiAPI } =require('./openAIapi');
const OpenAI =require('openai');


jest.setTimeout(5000);
describe('callOpenAiAPI', () => {
  it('should return a response message from the OpenAI API', async () => {
    const messages = [{ role: 'system', content: 'can you tell a joke' }];
    const response = await callOpenAiAPI(messages);
    console.log(response)
  });
});