import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../LoginSignup/ThemeContext";
import "./Course.css";
// Import MediaPipe Hands library and utilities
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

// Add a global recording reference outside the component
let isRecordingActive = false;

export const LessonVideo = () => {
  const navigate = useNavigate();
  const { courseSlug, lessonId } = useParams();
  const [isVideoComplete, setIsVideoComplete] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isSignCorrect, setIsSignCorrect] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [recording, setRecording] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(3);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const { isDarkMode } = useTheme();
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8000/api/lessons/${lessonId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch lesson");
        }

        const data = await response.json();
        console.log("Fetched lesson data:", data);

        // Convert youtu.be URLs to embed URLs
        if (data.videos && data.videos.length > 0) {
          data.videos = data.videos.map((url) => {
            if (url.includes("youtu.be/")) {
              const videoId = url.split("youtu.be/")[1].split("?")[0];
              return `https://www.youtube.com/embed/${videoId}`;
            } else if (url.includes("youtube.com/watch?v=")) {
              const videoId = url.split("v=")[1].split("&")[0];
              return `https://www.youtube.com/embed/${videoId}`;
            }
            return url;
          });
        }

        setLesson(data);
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < lesson.videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      setIsVideoComplete(true);
    }
  };

  const goToNextVideo = () => {
    if (currentVideoIndex < lesson.videos.length - 1) {
      if (isPracticeMode) {
        // Clean up camera resources before switching
        cleanupCamera();
        setIsPracticeMode(false);
        setCameraStarted(false);
      }
      setCurrentVideoIndex((prev) => prev + 1);
      setIsVideoComplete(false);
      setIsSignCorrect(false);
      setHasAttempted(false);
    }
  };

  const goToPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      if (isPracticeMode) {
        // Clean up camera resources before switching
        cleanupCamera();
        setIsPracticeMode(false);
        setCameraStarted(false);
      }
      setCurrentVideoIndex((prev) => prev - 1);
      setIsVideoComplete(false);
      setIsSignCorrect(false);
      setHasAttempted(false);
    }
  };

  const startPractice = () => {
    setIsPracticeMode(true);
    setHasAttempted(false);
    setIsSignCorrect(false);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Initialize MediaPipe Hands
        if (!handsRef.current) {
          handsRef.current = new Hands({
            locateFile: (file) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
          });

          handsRef.current.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.6, // Lower detection confidence for better capture
            minTrackingConfidence: 0.5, // Lower tracking confidence
          });

          handsRef.current.onResults((results) => {
            // Update hand detection status
            const hasHand =
              results.multiHandLandmarks &&
              results.multiHandLandmarks.length > 0;
            setHandDetected(hasHand);

            // Update debug info
            setDebugInfo((prev) => ({
              framesProcessed: prev.framesProcessed + 1,
              landmarksDetected: hasHand
                ? prev.landmarksDetected + 1
                : prev.landmarksDetected,
            }));

            // Store landmarks if hand is detected and we're recording
            if ((isRecordingActive || recording) && hasHand) {
              const landmarks = results.multiHandLandmarks[0];

              const width = videoRef.current.videoWidth;
              const height = videoRef.current.videoHeight;

              // Convert normalized landmarks to pixel space
              const pixelLandmarks = landmarks.map((l) => [
                Math.min(Math.floor(l.x * width), width - 1),
                Math.min(Math.floor(l.y * height), height - 1),
              ]);

              // Bounding box calculation (min/max coordinates)
              const xs = pixelLandmarks.map((p) => p[0]);
              const ys = pixelLandmarks.map((p) => p[1]);
              const minX = Math.min(...xs);
              const minY = Math.min(...ys);
              const maxX = Math.max(...xs);
              const maxY = Math.max(...ys);
              const bbox = [minX, minY, maxX, maxY]; // [x, y, x+w, y+h]

              // Normalize landmarks
              const baseX = pixelLandmarks[0][0];
              const baseY = pixelLandmarks[0][1];
              const centered = pixelLandmarks.map(([x, y]) => [
                x - baseX,
                y - baseY,
              ]);
              const flat = centered.flat();

              // Normalize using the max value from the flattened coordinates
              const maxVal = Math.max(...flat.map(Math.abs));
              const normalizedLandmarks =
                maxVal !== 0 ? flat.map((v) => v / maxVal) : flat;

              // Store normalized landmarks
              if (normalizedLandmarks.length === 42) {
                landmarkFramesRef.current.push(normalizedLandmarks);
                console.log(
                  `Landmark captured: ${normalizedLandmarks.length}, isRecordingActive: ${isRecordingActive}`
                );
              } else {
                console.warn(
                  `Invalid landmark count: ${normalizedLandmarks.length}, expected 42`
                );
              }
            }

            // Draw landmarks on canvas if we have a canvas reference
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext("2d");
              if (!ctx) return;

              // Clear canvas
              ctx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              );

              // Draw hand landmarks
              if (hasHand) {
                // Make canvas same size as video
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;

                // Add these lines to mirror the canvas context for drawing
                ctx.save();
                ctx.scale(-1, 1);
                ctx.translate(-canvasRef.current.width, 0);

                // Draw hand connections
                drawConnectors(
                  ctx,
                  results.multiHandLandmarks[0],
                  Hands.HAND_CONNECTIONS,
                  { color: "#00FF00", lineWidth: 5 }
                );

                // Draw landmarks
                drawLandmarks(ctx, results.multiHandLandmarks[0], {
                  color: "#FF0000",
                  lineWidth: 2,
                  radius: 4,
                });

                // Restore the context to its original state
                ctx.restore();
              }
            }
          });
        }

        // Start the camera
        if (!cameraRef.current && videoRef.current) {
          cameraRef.current = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });

          cameraRef.current.start();
        }

        setCameraStarted(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert(
        "Unable to access camera. Please make sure you have granted camera permissions."
      );
    }
  };

  const startRecording = () => {
    // Update both the state and global reference
    setRecording(true);
    isRecordingActive = true;

    setCountdown(3);
    // Reset landmarks storage and debug info
    landmarkFramesRef.current = [];
    setDebugInfo({ framesProcessed: 0, landmarksDetected: 0 });

    console.log(
      `Start recording called, isRecordingActive: ${isRecordingActive}`
    );

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
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
    // Reset landmark storage right at the point recording actually begins
    console.log("Begin actual recording, clearing landmark frames");
    landmarkFramesRef.current = [];

    // Set recording flags again to be extra sure
    isRecordingActive = true;
    setRecording(true);

    let timeLeft = recordingTime;
    setRecordingTime(timeLeft);

    const recordingInterval = setInterval(() => {
      timeLeft -= 1;
      setRecordingTime(timeLeft);

      // Log how many landmarks we've collected during recording
      if (timeLeft % 1 === 0) {
        console.log(
          `Recording in progress: ${recordingTime - timeLeft}s, frames: ${
            landmarkFramesRef.current.length
          }`
        );
      }

      if (timeLeft <= 0) {
        clearInterval(recordingInterval);
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = async () => {
    // Immediately update flags to prevent double requests
    if (!isRecordingActive || isSubmitting) return; // Guard against duplicate calls
    
    setRecording(false);
    isRecordingActive = false;
    setRecordingTime(3);
    setIsSubmitting(true); // Set flag to indicate we're submitting

    console.log("Stop recording called, isRecordingActive:", isRecordingActive);

    // Log landmark collection stats
    console.log(
      `Recording stats - Frames processed: ${debugInfo.framesProcessed}, Landmarks detected: ${debugInfo.landmarksDetected}`
    );
    console.log("Collected landmarks:", landmarkFramesRef.current.length);

    // Filter out any frames that don't have exactly 42 values
    const validFrames = landmarkFramesRef.current.filter(
      (frame) => frame.length === 42
    );
    console.log(
      `Valid frames with 42 values: ${validFrames.length} out of ${landmarkFramesRef.current.length}`
    );

    if (validFrames.length === 0) {
      alert(
        "No valid hand landmarks detected during recording. Please ensure your hand is visible in the camera view and try again."
      );
      setIsSubmitting(false); // Reset submitting flag
      return;
    }

    // If we have less than 5 frames of landmarks, warn the user but continue
    if (validFrames.length < 5) {
      console.warn("Very few landmarks detected - results may not be accurate");
    }

    // Prepare landmark data for submission
    try {
      const token = localStorage.getItem("token");

      // Send landmarks directly to the backend
      const response = await fetch("http://localhost:8000/api/classify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          landmarks: validFrames, // Only send the valid frames
          lesson_id: lessonId,
          sign: lesson.answers[currentVideoIndex],
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to analyze landmarks");
      }

      const data = await response.json();
      console.log("Classification result:", data);

      // Save a reference to the recording with prediction data
      setSavedRecordings((prev) => [
        ...prev,
        {
          sign: lesson.answers[currentVideoIndex],
          timestamp: new Date().toISOString(),
          result: {
            predictedSign: data.predictedSign,
            confidence: data.confidence / 100, // Convert percentage to decimal
            isCorrect: data.predictedSign === lesson.answers[currentVideoIndex]
          },
        },
      ]);

      // Check if the sign is correct
      const isCorrect = data.predictedSign === lesson.answers[currentVideoIndex];
      setIsSignCorrect(isCorrect);

      if (isCorrect) {
        setTimeout(() => {
          if (currentVideoIndex < lesson.videos.length - 1) {
            // Clean up before moving to next video
            cleanupCamera();
            setCurrentVideoIndex((prev) => prev + 1);
            setIsPracticeMode(false);
            setCameraStarted(false);
            setIsSignCorrect(false);
            setRecording(false);
          } else {
            setIsVideoComplete(true);
            cleanupCamera();
            setIsPracticeMode(false);
            setCameraStarted(false);
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to process hand landmarks. Please try again.");
    } finally {
      setIsSubmitting(false); // Always reset the submitting flag
    }

    // Add this line after setting isSubmitting
    setHasAttempted(true);
  };

  // First, create a function to properly clean up MediaPipe resources
  const cleanupCamera = () => {
    if (cameraRef.current) {
      console.log("Stopping camera");
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (handsRef.current) {
      console.log("Cleaning up MediaPipe hands");
      handsRef.current.close();
      handsRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      console.log("Stopping video streams");
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      cleanupCamera();
      isRecordingActive = false;
    };
  }, []);

  // Add after the useEffect for isDarkMode
  useEffect(() => {
    // Add WebGL context loss handling
    const handleContextLoss = () => {
      console.warn("WebGL context lost - attempting to restart camera");
      // Try to restart the camera to recover from context loss
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }

      if (handsRef.current) {
        handsRef.current = null;
      }

      // Force camera restart after a brief delay
      setTimeout(() => {
        if (cameraStarted) {
          startCamera();
        }
      }, 1000);
    };

    // Listen for WebGL context loss
    window.addEventListener("webglcontextlost", handleContextLoss);

    return () => {
      window.removeEventListener("webglcontextlost", handleContextLoss);
    };
  }, [cameraStarted]);

  // Add a useEffect to sync the recording state with the global reference
  useEffect(() => {
    isRecordingActive = recording;
    console.log("Recording state changed:", isRecordingActive);
  }, [recording]);

  // Add a listener effect to log all state changes for debugging
  useEffect(() => {
    console.log(
      "Component state - recording:",
      recording,
      "handDetected:",
      handDetected
    );
  }, [recording, handDetected]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading your lesson...</div>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!lesson) {
    return <div className="error">Lesson not found</div>;
  }

  return (
    <div className="lesson-container">
      <div className="lesson-header">
        <h2>{lesson.title}</h2>
        <div className="lesson-progress">
          <span>
            Video {currentVideoIndex + 1} of {lesson.videos.length}
          </span>
          <div className="progress-dots">
            {lesson.videos.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentVideoIndex ? "active" : ""}`}
              ></span>
            ))}
          </div>
        </div>
      </div>

      <div className="content-container">
        <div className="video-section">
          {!isPracticeMode ? (
            <div className="video-player">
              {lesson.videos && lesson.videos.length > 0 ? (
                <>
                  <div className="video-container">
                    <iframe
                      key={currentVideoIndex}
                      width="100%"
                      height="500"
                      src={lesson.videos[currentVideoIndex]}
                      title={`${lesson.title} - Video ${currentVideoIndex + 1}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="main-video"
                      onEnded={handleVideoEnd}
                    ></iframe>
                    <div className="video-navigation">
                      <button
                        className="nav-button prev-button"
                        onClick={goToPreviousVideo}
                        disabled={currentVideoIndex === 0}
                      >
                        Previous
                      </button>
                      <span className="current-sign">
                        {lesson.answers[currentVideoIndex]}
                      </span>
                      <button
                        className="nav-button next-button"
                        onClick={goToNextVideo}
                        disabled={
                          currentVideoIndex === lesson.videos.length - 1
                        }
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <button onClick={startPractice} className="practice-button">
                    <span className="practice-icon">🎯</span>
                    Practice Now
                  </button>
                </>
              ) : (
                <div className="no-video">
                  No videos available for this lesson
                </div>
              )}
            </div>
          ) : (
            <div className="practice-container">
              <div className="webcam-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="webcam-video"
                />
                <canvas
                  ref={canvasRef}
                  className="hand-canvas"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 10,
                  }}
                />

                {handDetected && (
                  <div className="hand-detected-indicator">Hand Detected ✓</div>
                )}

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
                      <div className="recording-debug">
                        Landmarks: {landmarkFramesRef.current.length}
                      </div>
                    </div>
                  </div>
                )}

                {isSignCorrect && hasAttempted && (
                  <div className="feedback-overlay correct">
                    <span>✓ Correct!</span>
                  </div>
                )}

                {!isSignCorrect && hasAttempted && recording === false && savedRecordings.length > 0 && (
                  <div className="feedback-overlay incorrect">
                    <span>✗ Incorrect! You signed: {
                      savedRecordings[savedRecordings.length-1].result?.predictedSign || "Unknown"
                    }</span>
                  </div>
                )}
              </div>

              <div className="practice-controls">
                {!cameraStarted && (
                  <button onClick={startCamera} className="camera-btn">
                    Start Camera
                  </button>
                )}
                {cameraStarted && !recording && !isSignCorrect && (
                  <button onClick={startRecording} className="record-btn">
                    Start Recording
                  </button>
                )}
                {hasAttempted && !recording && (
                  <button 
                    onClick={() => {
                      setHasAttempted(false);
                      setIsSignCorrect(false);
                    }} 
                    className="clear-btn"
                  >
                    Clear Results
                  </button>
                )}
                {!isSignCorrect && (
                  <button
                    onClick={() => {
                      cleanupCamera();
                      setIsPracticeMode(false);
                      setCameraStarted(false);
                      setHasAttempted(false);
                    }}
                    className="back-btn"
                  >
                    Back to Video
                  </button>
                )}
              </div>

              {savedRecordings.length > 0 && (
                <div className="saved-recordings">
                  <h3>Your Attempts</h3>
                  <div className="recordings-list">
                    {savedRecordings.map((recording, index) => (
                      <div key={index} className="recording-item">
                        <div className="recording-result">
                          <div
                            className={`result-indicator ${
                              recording.result?.isCorrect
                                ? "correct"
                                : "incorrect"
                            }`}
                          >
                            {recording.result?.isCorrect
                              ? "✓ Correct"
                              : "✗ Incorrect"}
                          </div>
                        </div>
                        <div className="recording-info">
                          <span><strong>Expected:</strong> {recording.sign}</span>
                          <span><strong>You signed:</strong> {recording.result?.predictedSign || "Unknown"}</span>
                          <span>
                            <strong>Confidence:</strong>{" "}
                            {Math.round(
                              (recording.result?.confidence || 0) * 100
                            )}
                            %
                          </span>
                          <span>
                            <strong>Time:</strong>{" "}
                            {new Date(recording.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="lesson-actions">
            {/* Remove the practice button from here */}
          </div>
        </div>

        <div className="lesson-sidebar">
          <div className="lesson-tips">
            <h3>Tips</h3>
            <ul>
              <li>Watch the hand movements carefully</li>
              <li>Practice in front of a mirror</li>
              <li>Focus on finger positioning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
