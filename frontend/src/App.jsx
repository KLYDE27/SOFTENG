import { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import './App.css';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

function App() {
  const [identifiedPerson, setIdentifiedPerson] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  
  // NEW: AI State
  const [aiMessage, setAiMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const APP_ID = "1c4fa734f0e743cebd10a935572c6fa5"; 
  const CHANNEL_NAME = "CognitiveRoom1";

  const joinVideoCall = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:3000/api/get-token?channelName=${CHANNEL_NAME}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(`BACKEND ERROR: ${errorData.error}`);
        return;
      }

      const data = await response.json();
      const token = data.token;
      const serverUid = data.uid; 

      const uid = await client.join(APP_ID, CHANNEL_NAME, token, serverUid); 
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      await client.publish([audioTrack, videoTrack]);
      setIsJoined(true);

      videoTrack.play('local-player');
    } catch (error) {
      console.error("Failed to connect:", error);
      alert("Failed to connect. Check the console for details.");
    }
  };

  // ... (Keep the useEffect for Agora event listeners exactly the same) ...
  useEffect(() => {
    const handleUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
        setTimeout(() => user.videoTrack.play(`remote-player-${user.uid}`), 0);
      }
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }
    };

    const handleUserUnpublished = (user) => {
      setRemoteUsers((prev) => {
        const currentUsers = { ...prev };
        delete currentUsers[user.uid];
        return currentUsers;
      });
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
    };
  }, []);

  const simulateDetection = () => {
    setIdentifiedPerson({
      name: "Maria",
      relation: "Your Daughter",
      imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150"
    });
    setTimeout(() => setIdentifiedPerson(null), 15000);
  };

  // NEW: Function to test the AI Brain
  const testAIAgent = async () => {
    setIsThinking(true);
    setAiMessage(""); // Clear old message
    try {
      const response = await fetch('http://127.0.0.1:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Who are you? I do not remember you being in my house.",
          callerContext: {
            callerName: identifiedPerson ? identifiedPerson.name : "Maria",
            relation: identifiedPerson ? identifiedPerson.relation : "daughter"
          }
        })
      });

      const data = await response.json();
      setAiMessage(data.reply);
      
      // Auto-hide the subtitle after 10 seconds
      setTimeout(() => setAiMessage(""), 10000);
    } catch (error) {
      console.error("AI Error:", error);
      setAiMessage("I am right here with you. Take your time.");
    }
    setIsThinking(false);
  };

   (
    <div className="cognitive-mirror-container">
      
      {/* 1. Main Video Feed */}
      <div className="main-video-feed">
        {Object.keys(remoteUsers).length === 0 ? (
          <div className="empty-state">
            <div className="pulse-ring"></div>
            <h2>Waiting for Family...</h2>
            <p>Your loved ones will appear here soon.</p>
          </div>
        ) : (
          Object.keys(remoteUsers).map((uid) => (
            <div key={uid} id={`remote-player-${uid}`} className="remote-video-wrapper"></div>
          ))
        )}
      </div>

      {/* NEW: AI Subtitle Overlay */}
      {(aiMessage || isThinking) && (
        <div className="ai-subtitle-container">
          {isThinking ? (
            <span className="thinking-dots">Cognitive Mirror is thinking...</span>
          ) : (
            <p className="ai-text">✨ "{aiMessage}"</p>
          )}
        </div>
      )}

      {/* 2. Relationship Card */}
      <div className={`relationship-card ${identifiedPerson ? 'slide-in' : ''}`}>
        {identifiedPerson && (
          <>
            <img src={identifiedPerson.imageUrl} alt={identifiedPerson.name} className="historical-photo" />
            <div className="metadata">
              <span className="badge">Verified Family</span>
              <h2 className="name-tag">{identifiedPerson.name}</h2>
              <p className="relation-tag">{identifiedPerson.relation}</p>
            </div>
          </>
        )}
      </div>

      {/* 3. Patient Preview */}
      <div className="patient-preview-container">
        <div id="local-player" className="patient-video-feed">
          {!isJoined && <span className="placeholder-text">Camera Off</span>}
        </div>
        <div className="patient-name-tag">
          👤 Klyde (You)
        </div>
      </div>

 {/* 4. Controls */}
 <div className="controls-container" style={{ display: 'flex', gap: '16px' }}>
        {!isJoined ? (
           <button className="connect-button" onClick={joinVideoCall}>
             🟢 START CALL
           </button>
        ) : (
           <button className="help-button" onClick={simulateDetection}>
             🔍 ID CALLER
           </button>
        )}
        
        {/* MOVED: Now the AI button is always visible! */}
        <button className="ai-returnbutton" onClick={testAIAgent} disabled={isThinking}>
          🧠 ASK AI
        </button>
      </div>
      
    </div>
  );
}

export default App;