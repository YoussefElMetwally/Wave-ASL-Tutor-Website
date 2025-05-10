const nodemailer = require('nodemailer');

// Check if email configuration is set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASS in your .env file');
}

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

const sendPasswordResetEmail = async (email, resetToken) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing');
  }

  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your Wave! account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #00aaff;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
      ">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Propagate the error to be handled by the controller
  }
};

module.exports = {
  sendPasswordResetEmail
}; 