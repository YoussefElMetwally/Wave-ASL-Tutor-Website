import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../LoginSignup/ThemeContext";
import { useSound } from "../LoginSignup/SoundContext";
import "./Course.css";
import closeIcon from '../Assets/close.png'; // Import the close icon
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
  const [showNextButton, setShowNextButton] = useState(false);
  const [showPracticeSuccess, setShowPracticeSuccess] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  // Add audio refs for sound effects
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { isSoundEnabled } = useSound();
  const [savedRecordings, setSavedRecordings] = useState([]);
  // Add refs and state for MediaPipe
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const landmarkFramesRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const [handDetected, setHandDetected] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    framesProcessed: 0,
    landmarksDetected: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [completedSigns, setCompletedSigns] = useState([]);
  const fetchedRef = useRef(false);
  const lessonCompletedRef = useRef(false);
  const [courseId, setCourseId] = useState(null);
  // Add a state to track feedback display status
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'correct', 'incorrect', or null
  const [showLessonCompletedPopup, setShowLessonCompletedPopup] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Load sound effects
  useEffect(() => {
    // Preload audio files
    if (correctSoundRef.current) {
      correctSoundRef.current.load();
    }
    if (incorrectSoundRef.current) {
      incorrectSoundRef.current.load();
    }
  }, []);

  // Play sound effects function
  const playSound = (isCorrect) => {
    // Only play sounds if they're enabled in settings
    if (!isSoundEnabled) return;
    
    if (isCorrect && correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0;
      correctSoundRef.current.play().catch(error => {
        console.error("Error playing correct sound:", error);
      });
    } else if (!isCorrect && incorrectSoundRef.current) {
      incorrectSoundRef.current.currentTime = 0;
      incorrectSoundRef.current.play().catch(error => {
        console.error("Error playing incorrect sound:", error);
      });
    }
  };

  useEffect(() => {
    // Prevent duplicate fetches in development mode (React StrictMode)
    if (fetchedRef.current) return;
    
    const fetchLesson = async () => {
      try {
        fetchedRef.current = true;
        const token = localStorage.getItem("token");
        // Try to access lesson with course enrollment check
        const enrollmentCheckUrl = `http://localhost:8000/api/courses/${courseSlug}/lessons/${lessonId}`;
        let response = await fetch(enrollmentCheckUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.status === 403) {
          // User is not enrolled in this course
          console.error('Access denied: Not enrolled in this course');
          navigate('/home', { 
            state: { 
              notificationMessage: 'You need to enroll in this course before accessing lessons',
              notificationType: 'error'
            } 
          });
          return;
        }

        // If the new endpoint fails for reasons other than access control, 
        // fall back to the original endpoint
        if (!response.ok && response.status !== 403) {
          response = await fetch(`http://localhost:8000/api/lessons/${lessonId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
        }

        if (!response.ok) {
          throw new Error("Failed to fetch lesson");
        }

        const data = await response.json();
        // Remove console.log for less console spam

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
        
        // Fetch the course ID based on the slug
        const courseResponse = await fetch(`http://localhost:8000/api/courses/${courseSlug}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (courseResponse.ok) {
          const courseData = await courseResponse.json();
          setCourseId(courseData.course_id);
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, courseSlug, navigate]);

  // Check if all signs are completed to mark the lesson as finished
  useEffect(() => {
    const checkLessonCompletion = async () => {
      // Only proceed if we have a lesson loaded, not already marked as completed, and have courseId
      if (!lesson || lessonCompletedRef.current || !courseId) return;
      
      // Check if all signs (videos) are completed
      if (completedSigns.length >= lesson.videos.length) {
        lessonCompletedRef.current = true;
        await markLessonAsCompleted();
      }
    };
    
    checkLessonCompletion();
  }, [completedSigns, lesson, courseId]);

  // Function to mark a lesson as completed and update course progress
  const markLessonAsCompleted = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      
      // Call the API to increment completed lessons
      const response = await fetch("http://localhost:8000/api/enrollment/increment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId
        }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Lesson marked as completed! Course progress updated:", data.progress);
        
        // Show a completion message
        if (completedSigns.length === lesson.videos.length) {
          alert("Congratulations! You've completed this lesson. Your progress has been updated.");
        }
      } else {
        console.error("Failed to update lesson completion status");
      }
    } catch (error) {
      console.error("Error marking lesson as completed:", error);
    }
  };

  const handleVideoEnd = () => {
    // Instead of automatically moving to the next video, show the next button
    setShowNextButton(true);
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
      setShowNextButton(false); // Reset the next button state
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
      setShowNextButton(false); // Reset the next button state
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
    // Reset recording state variables
    setRecording(true);
    isRecordingActive = true;
    landmarkFramesRef.current = [];
    setFeedbackStatus(null);
    setHasAttempted(false);
    setRecordingTime(3); // Reset recording time for next attempt

    setCountdown(3);
    // Reset landmarks storage and debug info
    landmarkFramesRef.current = [];
    setDebugInfo({ framesProcessed: 0, landmarksDetected: 0 });

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
    landmarkFramesRef.current = [];

    // Set recording flags again to be extra sure
    isRecordingActive = true;
    setRecording(true);

    // Clear any existing interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    let timeLeft = recordingTime;
    setRecordingTime(timeLeft);

    recordingIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setRecordingTime(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = async () => {
    // Immediately update flags to prevent double requests
    if (!isRecordingActive || isSubmitting) return; // Guard against duplicate calls
    
    // Clear any existing recording interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    setRecording(false);
    isRecordingActive = false;
    setRecordingTime(3);
    setIsSubmitting(true); // Set flag to indicate we're submitting
    
    // Clear any existing feedback temporarily during submission
    setFeedbackStatus(null);

    // Filter out any frames that don't have exactly 42 values
    const validFrames = landmarkFramesRef.current.filter(
      (frame) => frame.length === 42
    );

    if (validFrames.length === 0) {
      alert(
        "No valid hand landmarks detected during recording. Please ensure your hand is visible in the camera view and try again."
      );
      setIsSubmitting(false); // Reset submitting flag
      setHasAttempted(true);
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

      // Check if the sign is correct
      const isCorrect = data.predictedSign === lesson.answers[currentVideoIndex];
      
      // Set the feedback status first before any other state updates
      setFeedbackStatus(isCorrect ? 'correct' : 'incorrect');
      
      // Then update the sign correctness state
      setIsSignCorrect(isCorrect);
      
      // Now add to saved recordings
      setSavedRecordings((prev) => [
        ...prev,
        {
          sign: lesson.answers[currentVideoIndex],
          timestamp: new Date().toISOString(),
          result: {
            predictedSign: data.predictedSign,
            confidence: data.confidence / 100, // Convert percentage to decimal
            isCorrect: isCorrect
          },
        },
      ]);
      
      // Play sound effect based on result
      playSound(isCorrect);

      if (isCorrect) {
        // Add the current sign to completed signs if not already there
        setCompletedSigns(prev => {
          if (!prev.includes(currentVideoIndex)) {
            const newCompletedSigns = [...prev, currentVideoIndex];
            
            // Check if all signs are completed after adding this one
            if (newCompletedSigns.length === lesson.videos.length && !lessonCompletedRef.current) {
              // Mark the lesson as completed asynchronously
              markLessonAsCompleted();
              lessonCompletedRef.current = true;
            }
            
            return newCompletedSigns;
          }
          return prev;
        });
        
        setTimeout(() => {
          // Just show success but keep the user on the camera page
          // No need to set isSignCorrect again as it's already set
          
          // Show a notification that they've completed the sign successfully
          setShowPracticeSuccess(true);
          setTimeout(() => {
            setShowPracticeSuccess(false);
          }, 3000);
        }, 2000);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to process hand landmarks. Please try again.");
      setFeedbackStatus(null);
    } finally {
      setIsSubmitting(false); // Always reset the submitting flag
      setHasAttempted(true); // Mark as attempted
    }
  };

  // First, create a function to properly clean up MediaPipe resources
  const cleanupCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
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
      
      // Clear any recording interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
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
  }, [recording]);

  useEffect(() => {
    // Show the completion popup when the user completes the final sign
    if (completedSigns.length > 0 && 
        lesson && 
        completedSigns.includes(lesson.videos.length - 1) && 
        currentVideoIndex === lesson.videos.length - 1) {
      setShowLessonCompletedPopup(true);
    }
  }, [completedSigns, lesson, currentVideoIndex]);

  // Function to handle back button click
  const handleBackClick = () => {
    // Navigate back to the course details page
    navigate(`/course/${courseSlug}`);
  };

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
    
    <div className={`lesson-video-container ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      {/* Back button */}
      <div className="back-button" onClick={handleBackClick}>
        <img src={closeIcon} alt="Back to course" title="Back to course" />
      </div>
      {/* Audio elements for sound effects */}
      <audio ref={correctSoundRef} preload="auto">
        <source src="/src/Components/Assets/sounds/correct_sound.wav" type="audio/wav" />
      </audio>
      <audio ref={incorrectSoundRef} preload="auto">
        <source src="/src/Components/Assets/sounds/incorrect_sound.wav" type="audio/wav" />
      </audio>
      
      {/* Lesson Completed Popup */}
      {showLessonCompletedPopup && (
        <div className="lesson-completed-overlay">
          <div className="lesson-completed-popup">
            <div className="completion-icon">🎉</div>
            <h3>Lesson Completed!</h3>
            <p>Congratulations! You've completed all signs in this lesson.</p>
            <div className="completion-buttons">
              <button
                onClick={() => {
                  cleanupCamera();
                  // Navigate to the course page
                  navigate(`/course/${courseSlug}`);
                }}
                className="back-to-course-btn"
              >
                Back to Course
              </button>
              <button
                onClick={() => setShowLessonCompletedPopup(false)}
                className="close-popup-btn"
              >
                Continue Practicing
              </button>
            </div>
          </div>
        </div>
      )}

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
                className={`dot ${index === currentVideoIndex ? "active" : ""} ${
                  completedSigns.includes(index) ? "completed" : ""
                }`}
              ></span>
            ))}
          </div>
        </div>
      </div>

      <div className="content-container">
        {!isPracticeMode ? (
          <div className="video-section full-width">
            <div className="video-player">
              {lesson.videos && lesson.videos.length > 0 ? (
                <>
                  <div className="video-container">
                    <iframe
                      key={currentVideoIndex}
                      width="100%"
                      height="500"
                      src={`${lesson.videos[currentVideoIndex]}?autoplay=0&rel=0&enablejsapi=1`}
                      title={`${lesson.title} - Video ${currentVideoIndex + 1}`}
                      frameBorder="0"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                          currentVideoIndex === lesson.videos.length - 1 ||
                          !completedSigns.includes(currentVideoIndex)
                        }
                      >
                        Next
                      </button>
                    </div>
                    
                    {showNextButton && (
                      <div className="next-sign-overlay">
                        <div className="next-sign-content">
                          <p>Ready to move to the next sign?</p>
                          <button 
                            className="next-sign-button"
                            onClick={() => {
                              if (currentVideoIndex < lesson.videos.length - 1) {
                                goToNextVideo();
                              } else {
                                setIsVideoComplete(true);
                              }
                            }}
                          >
                            {currentVideoIndex < lesson.videos.length - 1 ? 'Next Sign' : 'Complete Lesson'}
                          </button>
                        </div>
                      </div>
                    )}
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

            <div className="lesson-actions">
              {/* Remove the practice button from here */}
            </div>
          </div>
        ) : (
          <div className="practice-container full-width">
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
                  </div>
                </div>
              )}

              {feedbackStatus === 'correct' && hasAttempted && (
                <div className="feedback-overlay correct">
                  <span>✓ Correct!</span>
                </div>
              )}

              {feedbackStatus === 'incorrect' && hasAttempted && recording === false && savedRecordings.length > 0 && !isSubmitting && (
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
                    setFeedbackStatus(null);
                    setRecordingTime(3); // Reset recording time
                    landmarkFramesRef.current = []; // Clear stored landmarks
                    setDebugInfo({ framesProcessed: 0, landmarksDetected: 0 }); // Reset debug info
                  }} 
                  className="clear-btn"
                >
                  Clear Results
                </button>
              )}
              {!recording && (
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
              {isSignCorrect && completedSigns.includes(currentVideoIndex) && currentVideoIndex < lesson.videos.length - 1 && (
                <button
                  onClick={() => {
                    cleanupCamera();
                    setIsPracticeMode(false);
                    setCameraStarted(false);
                    setHasAttempted(false);
                    setIsSignCorrect(false);
                    goToNextVideo();
                  }}
                  className="next-sign-btn"
                >
                  Next Sign
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
      </div>
    </div>
  );
};