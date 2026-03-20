// signaling/broadcast.js
const AgoraRTM = require('agora-rtm-sdk');

class SignalingService {
  constructor(appId) {
    this.appId = appId;
    this.client = AgoraRTM.createInstance(appId);
  }

  async publishIdentification(channelName, data) {
    const channel = this.client.createChannel(channelName);
    await channel.join();

    const msg = JSON.stringify({
      type: 'FACE_IDENTIFIED',
      payload: data,
    });

    await channel.sendMessage({ text: msg });
  }
}

module.exports = { SignalingService };
