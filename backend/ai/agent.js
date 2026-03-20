// ai/agent.js
const OpenAI = require('openai');
const sdk = require("microsoft-cognitiveservices-speech-sdk");

class ConversationalAgent {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async respond(transcript, familyContext) {
    // Configured with the System Message defining the agent [cite: 173]
    const systemMsg = `You are a patient-focused cognitive assistant.
Family on call: ${familyContext.join(', ')}.
Keep answers short, warm, and patient.`;

    const chat = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: transcript },
      ],
      max_tokens: 120,
    });

    const text = chat.choices[0].message.content;

    // Use Azure for TTS [cite: 144]
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION);
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; // High-fidelity female voice
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        result => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve({ text, audio: result.audioData });
          } else {
            reject(new Error("Synthesis failed: " + result.errorDetails));
          }
          synthesizer.close();
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    });
  }
}

module.exports = { ConversationalAgent };