import React, { useState, useEffect } from 'react';
import { FaRegLightbulb, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './Course.css';

// Ultra-short tips for each category
const tipsByCategory = {
  general: [
    "Watch hand movements carefully.",
    "Keep your wrist relaxed but stable.",
    "Pay attention to facial expressions."
  ],
  alphabet: [
    "Keep palm facing outward.",
    "Make handshapes precise.",
    "Maintain steady rhythm when spelling."
  ],
  numbers: [
    "Numbers 1-5: palm out, 6-9: palm in.",
    "Keep number shapes crisp and clear.",
    "Hold each number before transitioning."
  ]
};

const ASLTips = ({ lessonType }) => {
  const [expanded, setExpanded] = useState(true);
  const [tips, setTips] = useState([]);
  
  useEffect(() => {
    // Select just 3 tips based on lesson type
    if (lessonType === 'numbers') {
      setTips(tipsByCategory.numbers);
    } else if (lessonType === 'alphabet') {
      setTips(tipsByCategory.alphabet);
    } else {
      setTips(tipsByCategory.general);
    }
  }, [lessonType]);

  return (
    <div className={`asl-tips-container ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="asl-tips-header" onClick={() => setExpanded(!expanded)}>
        <div className="asl-tips-title">
          <FaRegLightbulb className="asl-tips-icon" /> Sign Language Tips
        </div>
        <button className="asl-tips-toggle" aria-label={expanded ? "Collapse tips" : "Expand tips"}>
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {expanded && (
        <div className="asl-tips-content">
          <ul>
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ASLTips; 