import OpenAI from "openai";
import dotenv from 'dotenv'; 

dotenv.config();
const respId = ''; 
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY
})

