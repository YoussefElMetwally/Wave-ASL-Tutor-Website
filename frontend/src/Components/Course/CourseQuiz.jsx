import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Course.css";

const CourseQuiz = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching quiz for course slug:", courseSlug);
        
        const response = await fetch(
          `http://localhost:8000/api/courses/${courseSlug}/quiz`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        console.log("Quiz API response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          throw new Error(errorData.message || "Failed to fetch quiz");
        }

        const data = await response.json();
        console.log("Quiz data received:", data);
        setQuiz(data);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [courseSlug]);

  const handleAnswerSelection = (questionId, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Check if all questions are answered
    if (Object.keys(selectedAnswers).length < quiz.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    console.log("Submitting answers:", selectedAnswers);

    try {
      const token = localStorage.getItem("token");
      const body = JSON.stringify({ answers: selectedAnswers });
      console.log("Request body:", body);
      
      const response = await fetch(
        `http://localhost:8000/api/courses/${courseSlug}/quiz/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: body,
        }
      );

      console.log("Submit response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response data:", errorData);
        throw new Error(errorData.message || "Failed to submit quiz");
      }

      const result = await response.json();
      console.log("Quiz submission result:", result);
      setScore(result.score);
      setQuizPassed(result.passed);
      setQuizSubmitted(true);
      setShowResults(true);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError(err.message);
    }
  };

  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizSubmitted(false);
    setShowResults(false);
  };

  const handleBackToCourse = () => {
    navigate(`/course/${courseSlug}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!quiz) {
    return <div className="error">Quiz not found</div>;
  }

  return (
    <div className="course-quiz-container">
      <div className="course-quiz-header">
        <h1>Course Completion Quiz</h1>
        <p>Answer all 5 questions to complete the course. You need 4/5 correct answers to pass.</p>
      </div>

      {!showResults ? (
        <div className="quiz-content">
          <div className="quiz-progress">
            <span>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <div className="quiz-progress-bar">
              <div
                className="quiz-progress-filled"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / quiz.questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <div className="quiz-question">
            <h3>{quiz.questions[currentQuestionIndex].question}</h3>
            
            {quiz.questions[currentQuestionIndex].type === "Image-MCQ" && 
              quiz.questions[currentQuestionIndex].image_url && (
                <div className="quiz-question-image-container">
                  <img 
                    src={quiz.questions[currentQuestionIndex].image_url} 
                    alt="ASL Sign" 
                    className="quiz-question-image"
                  />
                </div>
              )
            }
            
            <div className="quiz-options">
              {quiz.questions[currentQuestionIndex].mcq.map((option, index) => (
                <div
                  key={index}
                  className={`quiz-option ${
                    selectedAnswers[quiz.questions[currentQuestionIndex].question_id] ===
                    option
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleAnswerSelection(
                      quiz.questions[currentQuestionIndex].question_id,
                      option
                    )
                  }
                >
                  {option}
                </div>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="quiz-nav-button"
            >
              Previous
            </button>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="quiz-nav-button"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="quiz-submit-button"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="quiz-results">
          <div className={`quiz-result-card ${quizPassed ? "passed" : "failed"}`}>
            <div className="quiz-result-icon">
              {quizPassed ? "🎉" : "⚠️"}
            </div>
            <h2>{quizPassed ? "Congratulations!" : "Almost there!"}</h2>
            <p>
              You scored {score} out of {quiz.questions.length}.
            </p>
            <p>
              {quizPassed
                ? "You have successfully completed the course!"
                : "You need to score at least 4/5 to pass. Please try again."}
            </p>
            <div className="quiz-result-actions">
              {quizPassed ? (
                <button
                  onClick={handleBackToCourse}
                  className="quiz-primary-button"
                >
                  Back to Course
                </button>
              ) : (
                <button
                  onClick={handleRetakeQuiz}
                  className="quiz-primary-button"
                >
                  Retake Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseQuiz; 