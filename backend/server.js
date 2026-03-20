const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const app = express();
app.use(cors()); // Fixes the cross-origin block from Vite

// IMPORTANT: Paste your Agora App ID and App Certificate here
const APP_ID = 'YOUR_APP_ID_HERE';
const APP_CERTIFICATE = 'YOUR_APP_CERTIFICATE_HERE';

app.get('/api/get-token', (req, res) => {
  const channelName = req.query.channelName;
  if (!channelName) {
    return res.status(400).json({ error: 'channelName is required' });
  }

  // Set expiration times (1 hour)
  const expirationTimeInSeconds = 3600;
  
  // Create a random UID for the user
  const uid = Math.floor(Math.random() * 100000); 

  try {
    // Generate the dual RTC/RTM token required by the Cognitive Mirror architecture
    const token = RtcTokenBuilder.buildTokenWithRtm2(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expirationTimeInSeconds,
      expirationTimeInSeconds,
      expirationTimeInSeconds,
      expirationTimeInSeconds,
      expirationTimeInSeconds,
      String(uid),
      expirationTimeInSeconds
    );

    res.json({ token, uid });
  } catch (error) {
    console.error("Token generation failed:", error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

app.listen(3000, () => {
  console.log('Cognitive Mirror Backend is running on http://localhost:3000');
});