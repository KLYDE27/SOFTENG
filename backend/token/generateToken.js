// token/generateToken.js
const { RtcTokenBuilder, RtcRole } = require('agora-token');

function generateToken(channelName, uid, role = RtcRole.PUBLISHER) {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const expire = 3600; // 1 hour

  // Generates a token with dual privileges for RTC and RTM 2.0 
  const token = RtcTokenBuilder.buildTokenWithRtm2(
    appId,
    appCertificate,
    channelName,
    String(uid),
    role,
    expire,
    expire
  );

  return token;
}

module.exports = { generateToken };