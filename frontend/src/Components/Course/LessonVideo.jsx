import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../LoginSignup/ThemeContext';
import './Course.css';

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
  const [predictionResult, setPredictionResult] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [recording, setRecording] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(1);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const { isDarkMode } = useTheme();
  const [savedRecordings, setSavedRecordings] = useState([]);

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/lessons/${lessonId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch lesson');
        }

        const data = await response.json();
        console.log('Fetched lesson data:', data);
        
        // Convert youtu.be URLs to embed URLs
        if (data.videos && data.videos.length > 0) {
          data.videos = data.videos.map(url => {
            if (url.includes('youtu.be/')) {
              const videoId = url.split('youtu.be/')[1].split('?')[0];
              return `https://www.youtube.com/embed/${videoId}`;
            } else if (url.includes('youtube.com/watch?v=')) {
              const videoId = url.split('v=')[1].split('&')[0];
              return `https://www.youtube.com/embed/${videoId}`;
            }
            return url;
          });
        }
        
        setLesson(data);
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < lesson.videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    } else {
      setIsVideoComplete(true);
    }
  };

  const goToNextVideo = () => {
    if (currentVideoIndex < lesson.videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      setIsVideoComplete(false);
    }
  };

  const goToPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
      setIsVideoComplete(false);
    }
  };

  const startPractice = () => {
    setIsPracticeMode(true);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"  // This ensures the front camera is used on mobile devices
        },
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

    // Capture a frame from the video when recording starts
    const captureFrame = () => {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      return new Promise(resolve => {
        canvas.toBlob(blob => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    };

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Capture a frame from the video
      const frameBlob = await captureFrame();
      
      const blob = new Blob(chunks, { type: 'video/webm' });
      const formData = new FormData();
      
      // Create a File object from the Blob
      const videoFile = new File([blob], 'recording.webm', { type: 'video/webm' });
      const frameFile = new File([frameBlob], 'frame.jpg', { type: 'image/jpeg' });
      
      formData.append('video', videoFile);
      formData.append('frame', frameFile);
      formData.append('sign', lesson.answers[currentVideoIndex]);
      formData.append('lessonId', lessonId);

      // Debug logging
      console.log('Video file size:', videoFile.size);
      console.log('Frame file size:', frameFile.size);
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      try {
        const token = localStorage.getItem('token');
        
        // First save the recording
        console.log('Sending recording to backend...');
        const saveResponse = await fetch('http://localhost:8000/api/save-recording', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
          credentials: 'include',
        });

        console.log('Save response status:', saveResponse.status);
        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error('Save response error:', errorText);
          throw new Error('Failed to save recording');
        }

        const saveData = await saveResponse.json();
        console.log('Save response data:', saveData);

        setSavedRecordings(prev => [...prev, {
          url: `http://localhost:8000${saveData.filePath}`,
          sign: lesson.answers[currentVideoIndex],
          timestamp: new Date().toISOString()
        }]);

        // Then check if the sign is correct
        const checkResponse = await fetch('http://localhost:8000/api/check-sign', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
          credentials: 'include',
        });

        if (!checkResponse.ok) {
          throw new Error('Failed to check sign');
        }

        const checkData = await checkResponse.json();
        setIsSignCorrect(checkData.isCorrect);
        setPredictionResult({
          predicted: checkData.predictedSign,
          expected: checkData.expectedSign,
          confidence: Math.round(checkData.confidence * 100)
        });

        if (checkData.isCorrect) {
          setTimeout(() => {
            if (currentVideoIndex < lesson.videos.length - 1) {
              setCurrentVideoIndex(prev => prev + 1);
              setIsPracticeMode(false);
              setIsSignCorrect(false);
              setPredictionResult(null);
              setRecording(false);
              setCameraStarted(false);
            } else {
              setIsVideoComplete(true);
            }
          }, 3000);
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Failed to process recording. Please try again.');
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

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
    setRecordingTime(1);
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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
          <span>Video {currentVideoIndex + 1} of {lesson.videos.length}</span>
          <div className="progress-dots">
            {lesson.videos.map((_, index) => (
              <span 
                key={index} 
                className={`dot ${index === currentVideoIndex ? 'active' : ''}`}
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
                        disabled={currentVideoIndex === lesson.videos.length - 1}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={startPractice} 
                    className="practice-button"
                  >
                    <span className="practice-icon">🎯</span>
                    Practice Now
                  </button>
                </>
              ) : (
                <div className="no-video">No videos available for this lesson</div>
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

                {isSignCorrect && (
                  <div className="feedback-overlay correct">
                    <span>✓ Correct!</span>
                    {predictionResult && (
                      <div className="prediction-details">
                        <p>Predicted: {predictionResult.predicted} ({predictionResult.confidence}% confidence)</p>
                      </div>
                    )}
                  </div>
                )}

                {!isSignCorrect && predictionResult && (
                  <div className="feedback-overlay incorrect">
                    <span>✗ Incorrect</span>
                    <div className="prediction-details">
                      <p>Expected: {predictionResult.expected}</p>
                      <p>Predicted: {predictionResult.predicted} ({predictionResult.confidence}% confidence)</p>
                      <p>Try again!</p>
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
                {cameraStarted && !recording && !isSignCorrect && (
                  <button onClick={startRecording} className="record-btn">
                    Start Recording
                  </button>
                )}
                {!isSignCorrect && (
                  <button onClick={() => setIsPracticeMode(false)} className="back-btn">
                    Back to Video
                  </button>
                )}
              </div>
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