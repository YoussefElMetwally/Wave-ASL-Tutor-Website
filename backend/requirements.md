## User Management Functions

1. User Registration:
   [x] Create new accounts with credentials.
   [x] Store and validate user data securely.
   possible edit: (Add verification using email and OTP)

2. User Authentication:
   [x] Login with email and password.
   [x] Logout functionality.
   [x] Session management.

3. User Profiles:
   [x] Retrieve and update user data.
   [_] Track user progress (enrolled courses, completed lessons)

## Course Management Functions

1. Course Browsing:
   [X] Fetch and display available courses categorized by skill levels.
   [_] Provide previews of course content.

2. Course Enrollment:
   [x] Allow users to enroll in specific courses.
   [_] Maintain enrollment records in the database.
   [x] Check course Enrollment

3. Progress Tracking:
   [_] Mark lessons as complete.
   [_] Calculate and store overall course progress.
   [_] Fetch progress data for the user profile page.

## Content Management Functions

1. Video Lessons:
   [_] Retrieve and stream video content for lessons.
   [_] Ensure compatibility with web and mobile interfaces.

2. Tests & Quizzes:
   [_] Deliver interactive tests after lessons.
   [x] Evaluate test responses and store results.

## Gesture Recognition Functions

1. Camera Access:
   [_] Securely access the user's camera.
   [_] Validate camera permissions and configurations.

2. Gesture Analysis:
   [_] Process video input to detect and evaluate hand gestures.
   [_] Compare gestures against predefined ASL signs using a recognition algorithm (e.g., TensorFlow or MediaPipe).

3. Real-Time Feedback:
   [_] Provide instant feedback (e.g., "Correct" or "Try Again") based on gesture analysis.
   [_] Highlight specific errors (e.g., handshape, movement).

## Notification Management Functions

1. Reminder Notifications:
   [_] Send periodic notifications to encourage course completion.
   [_] Allow users to opt-in or out of notifications.

## Database Management Functions

1. User Data Storage:
   [_] Store user account details securely.
   [_] Track enrolled courses, progress, and test results.

2. Content Storage:
   [_] Store course metadata (e.g., skill level, lesson titles).
   [_] Manage video and test data.

## Security and Compliance Functions

1. Data Protection:
   [_] Ensure all sensitive data (e.g., passwords, progress records) is encrypted.
   [_] Process camera input data without storing it.
