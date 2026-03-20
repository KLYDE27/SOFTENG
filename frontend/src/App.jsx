import { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import './App.css';

// Initialize the Agora Client
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

function App() {
  // --- 1. Cognitive Mirror State ---
  const [identifiedPerson, setIdentifiedPerson] = useState(null);

  // --- 2. Agora RTC State ---
  const [isJoined, setIsJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});

  // IMPORTANT: Paste your Agora App ID here
  const APP_ID = "YOUR_AGORA_APP_ID_HERE"; 
  const CHANNEL_NAME = "CognitiveRoom1";

  // --- 3. Connect to Backend & Join Call ---
  const joinVideoCall = async () => {
    try {
      console.log("Fetching token from backend...");
      // Ask your Node.js backend (running on port 3000) for the token
      const response = await fetch(`http://localhost:3000/api/get-token?channelName=${CHANNEL_NAME}`);
      const data = await response.json();
      const token = data.token;

      // Join the Agora channel using the credentials
      const uid = await client.join(APP_ID, CHANNEL_NAME, token, null);
      console.log("Joined Agora channel with UID:", uid);

      // Request camera and microphone permissions
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Publish your feed to the channel
      await client.publish([audioTrack, videoTrack]);
      setIsJoined(true);

      // Play your camera feed in the bottom-right UI box
      videoTrack.play('local-player');

    } catch (error) {
      console.error("Failed to connect to Agora or Backend:", error);
      alert("Backend connection failed! Is your Node.js server running on port 3000?");
    }
  };

  // --- 4. Handle Remote Callers Joining ---
  useEffect(() => {
    const handleUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        // Add the remote user to state
        setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
        // Give React a millisecond to render the DOM div before injecting the video
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

    // Cleanup listeners when component unmounts
    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
    };
  }, []);

  // --- 5. Simulate AI Identification ---
  const simulateDetection = () => {
    setIdentifiedPerson({
      name: "Sarah",
      relation: "Your Granddaughter",
      imageUrl: "https://placehold.co/150x150/png?text=Young+Sarah"
    });
  };

  return (
    <div className="cognitive-mirror-container">
      
      {/* 1. Main Video Feed (Remote Caller) */}
      <div className="main-video-feed">
        {Object.keys(remoteUsers).length === 0 ? (
          <div className="placeholder-text">Waiting for remote caller...</div>
        ) : (
          Object.keys(remoteUsers).map((uid) => (
            <div 
              key={uid} 
              id={`remote-player-${uid}`} 
              style={{ width: '100%', height: '100%' }}
            ></div>
          ))
        )}
      </div>

      {/* 2. Relationship Card (Slides in when identifiedPerson is not null) */}
      <div className={`relationship-card ${identifiedPerson ? 'slide-in' : ''}`}>
        {identifiedPerson && (
          <>
            <img src={identifiedPerson.imageUrl} alt={identifiedPerson.name} className="historical-photo" />
            <div className="metadata">
              <h2 className="name-tag">{identifiedPerson.name}</h2>
              <p className="relation-tag">{identifiedPerson.relation}</p>
            </div>
          </>
        )}
      </div>

      {/* 3. Patient Preview & Name Tag */}
      <div className="patient-preview-container">
        {/* The ID 'local-player' is used by Agora to inject your camera feed */}
        <div id="local-player" className="patient-video-feed">
          {!isJoined && <span className="placeholder-text">Camera Off</span>}
        </div>
        <div className="patient-name-tag">
          Klyde - You
        </div>
      </div>

      {/* 4. Controls (Join, Help, Volume) */}
      <div className="controls-container">
        {!isJoined && (
           <button 
             style={{ backgroundColor: '#4CAF50', padding: '20px', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer', border: 'none' }} 
             onClick={joinVideoCall}
           >
             CONNECT
           </button>
        )}
        
        <button className="help-button" onClick={simulateDetection}>
           HELP
        </button>
        
        <div className="volume-control">
          <label htmlFor="volume">Volume</label>
          <input type="range" id="volume" name="volume" min="0" max="100" className="volume-slider"/>
        </div>
      </div>
      
    </div>
  );
}

export default App;