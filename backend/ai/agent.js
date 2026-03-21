require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateModeratorResponse(patientMessage, context) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are the 'Cognitive Mirror', a warm, patient, and highly empathetic AI moderator assisting a person with Alzheimer's during a video call. 
          Current Call Context: The patient is talking to ${context.callerName}, who is their ${context.relation}.
          Rules:
          1. Keep answers extremely short (1-2 sentences max).
          2. Never argue. Validate their feelings.
          3. Gently remind them who they are talking to if they seem confused.
          4. Use simple, reassuring language.`
        },
        {
          role: "user",
          content: patientMessage
        }
      ],
      temperature: 0.5,
      max_tokens: 100,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("❌ OpenAI Engine Error:", error);
    return "I am right here with you. Take your time."; 
  }
}

// THIS IS THE FIX: Exporting the correct function name
module.exports = { generateModeratorResponse };