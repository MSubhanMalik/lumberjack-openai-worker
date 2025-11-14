import express from 'express'; 
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv'
dotenv.config();

const app = express(); 
const OpenaiAPIKey = process.env.OPENAI_API_KEY; 
const supabase = createClient({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY
})
const openai = new OpenAI({
    apiKey: OpenaiAPIKey
})

app.use(express.json()); 
app.use((req, res, next) => {
  req.setTimeout(72 * 60 * 1000); 
  next();
});

const formatClaims = (json_data)=>{
  function stripFences(s) {
    if (!s) return s;
    s = String(s).trim();
    if (s.startsWith('```')) {
      const firstNL = s.indexOf('\n');
      const lastTicks = s.lastIndexOf('```');
      if (firstNL !== -1 && lastTicks !== -1 && lastTicks > firstNL) {
        return s.slice(firstNL + 1, lastTicks).trim();
      }
    }
    return s;
  }
  const root = json_data;
  const outputArr = Array.isArray(root) ? root[0]?.output || [] : root.output || [];
  const msg = outputArr.find((o)=>Array.isArray(o.content) && o.content.some((c)=>c.type === 'output_text'));
  const text = msg?.content?.find((c)=>c.type === 'output_text')?.text;
  if (!text) {
    return [];
  }
  const cleaned = stripFences(text);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return [];
  }
  const arr = Array.isArray(parsed) ? parsed : [
    parsed
  ];
  return arr;
};

const process_each_influencer = async(influencer) => {
    const researchPrompt = `Your job is to research the well known influencer ${influencer.name}. Your goal is to identify a list of claims they made since 2015. You must provide 2 claims and break down each claim like this. YOU MUST FORMAT EACH CLAIM IN THIS FORMAT:
    {
    "id": null,
    "creator_id": ${influencer.id},
    "claim_text": "one liner summary of the claim",
    "claim_description": "one paragraph description of the nature of the claim",
    "date_made": "timestampz",
    "source_url": "a source to the original claim"
    }`

    const openAiResponse = await openai.responses.create({
        model: "o4-mini-deep-research",
        input: researchPrompt,
        tools: [
            {
            type: "web_search_preview"
            }
        ], 
        }, {
             timeout: 72 * 60 * 1000,
        });
    const processedOutput = formatClaims(openAiResponse);
    await supabase.functions.invoke("process_openai_job", {
        body: {
            claims: processedOutput, 
            creator_name: influencer.name
        }
    })
}

app.get("/", async (req, res) => {
    const { data } = req.body; 
    for (const item of data){
        await process_each_influencer(item);
    }
    return res.json({ status: "completed" });
})

app.listen(3000, ()=> {
    console.log('Server is running on port 3000');
}); 