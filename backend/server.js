const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const app = express();
app.use(cors());

const APP_ID = '1c4fa734f0e743cebd10a935572c6fa5';
const APP_CERTIFICATE = '0dc31c316ec14fd18d87a61c15276e21'; // <-- PASTE THIS

app.get('/api/get-token', (req, res) => {
  const channelName = req.query.channelName;
  if (!channelName) {
    return res.status(400).json({ error: 'channelName is required' });
  }

  const expireTime = 3600;
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  const uid = Math.floor(Math.random() * 100000); 

  try {
    // HARDCODED FIX: 1 = Publisher. This bypasses the broken RtcRole enum.
    const role = 1; 

    // Try generating the token (Newer agora-token package syntax - 7 parameters)
    let token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpireTime,
      privilegeExpireTime 
    );

    // Fallback: If it's STILL blank, you have the older package installed (6 parameters)
    if (!token) {
      token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        role,
        privilegeExpireTime
      );
    }

    if (!token) {
       throw new Error("Library returned an empty string regardless of parameters.");
    }

    console.log("✅ SUCCESS! Generated Token:", token);
    res.json({ token: token, uid: uid });
    
  } catch (error) {
    console.error("❌ Token generation failed:", error);
    res.status(500).json({ error: error.message });
  }
});

const { generateModeratorResponse } = require('./ai/agent.js');

// ... (your existing Agora /api/get-token code remains here) ...

// NEW: AI Chat Endpoint
app.post('/api/chat', express.json(), async (req, res) => {
  const { message, callerContext } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const context = callerContext || { callerName: "a family member", relation: "loved one" };
  const aiReply = await generateModeratorResponse(message, context);
  
  res.json({ reply: aiReply });
});

app.listen(3000, () => {
  console.log('✅ Cognitive Mirror Backend is running on http://127.0.0.1:3000');
});