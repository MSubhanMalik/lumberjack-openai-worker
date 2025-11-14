import express from 'express'; 
import OpenAI from 'openai';
import dotenv from 'dotenv'
dotenv.config();

const OpenaiAPIKey = process.env.OPENAI_API_KEY; 
const openai = new OpenAI({
    apiKey: OpenaiAPIKey
})
const app = express(); 
app.use(express.json()); 
app.use((req, res, next) => {
  req.setTimeout(72 * 60 * 1000); // 5 minutes
  next();
});


app.get('/retrieve', async(req, res) => {
    const respId = 'resp_0897d3965572d438006916b5ded7548196ad54ca1f34aba4d8'; 
    const response = await openai.responses.retrieve(respId);
    const output = response.output_text; 
    return res.json(output);
})


app.get("/", async (req, res) => {
    const researchPrompt = `Your job is to research the well known influencer Claire Lehmann. Your goal is to identify a list of claims they made since 2015. You must provide 2 claims and break down each claim like this. YOU MUST FORMAT EACH CLAIM IN THIS FORMAT:
    {
    "id": null,
    "creator_id": "",
    "claim_text": "one liner summary of the claim",
    "claim_description": "one paragraph description of the nature of the claim",
    "date_made": "timestampz",
    "source_url": "a source to the original claim"
    }`

    const openAiResponse = await openai.responses.create({
        model: "o4-mini-deep-research",
        input: researchPrompt,
        background: true, 
        tools: [
            {
            type: "web_search_preview"
            }
        ], 
        });

    console.log(openAiResponse); 
    return res.json(openAiResponse);
})

app.listen(3000, ()=> {
    console.log('Server is running on port 3000');
}); 