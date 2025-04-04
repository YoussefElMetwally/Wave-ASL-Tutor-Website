import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Course.css';

export const Practice = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [countdown, setCountdown] = useState(null);
  const [recording, setRecording] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(5);
  const navigate = useNavigate();

  // Cleanup function to stop the camera when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStarted(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Unable to access camera. Please make sure you have granted camera permissions.");
    }
  };

  const startRecording = () => {
    setRecording(true);
    setCountdown(3);

    // Start countdown from 3
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          beginRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginRecording = () => {
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      console.log('Recording completed:', videoUrl);
      // Here you can send the blob to your backend
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    // Show recording countdown
    let timeLeft = recordingTime;
    setRecordingTime(timeLeft);

    const recordingInterval = setInterval(() => {
      timeLeft -= 1;
      setRecordingTime(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(recordingInterval);
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setRecordingTime(5);

    // Stop the camera
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraStarted(false);
  };

  return (
    <div className="practice-container">
      <h2>Practice: Basic Greetings</h2>
      
      <div className="webcam-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="webcam-video"
        />
        
        {countdown && (
          <div className="countdown-overlay">
            <span className="countdown-number">{countdown}</span>
          </div>
        )}

        {recording && recordingTime > 0 && (
          <div className="recording-overlay">
            <div className="recording-indicator">
              <span className="recording-dot"></span>
              Recording: {recordingTime}s
            </div>
          </div>
        )}
      </div>

      <div className="practice-controls">
        {!cameraStarted && (
          <button onClick={startCamera} className="camera-btn">
            Start Camera
          </button>
        )}
        {cameraStarted && !recording && (
          <button onClick={startRecording} className="record-btn">
            Start Recording
          </button>
        )}
      </div>
    </div>
  );
}; 