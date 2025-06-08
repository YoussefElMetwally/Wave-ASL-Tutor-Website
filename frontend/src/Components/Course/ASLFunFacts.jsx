import React, { useState, useEffect } from 'react';
import { FaLightbulb, FaSyncAlt } from 'react-icons/fa';
import './Course.css';

// Collection of shorter ASL fun facts
const aslFunFacts = [
  "ASL is not a universal language - there are over 300 different sign languages worldwide.",
  "The sign for 'I love you' combines the handshapes for the letters I, L, and Y.",
  "ASL originated in the early 1800s from French Sign Language mixed with local signing.",
  "The first school for the deaf in the US was established in 1817.",
  "In ASL, facial expressions are grammatically important and change meaning.",
  "ASL fingerspelling uses a one-handed alphabet, unlike British Sign Language.",
  "ASL has regional 'accents' with signs varying between US regions.",
  "Babies can learn sign language before they can speak.",
  "ASL has its own grammar different from English.",
  "ASL uses 3D space around the signer to convey meaning."
];

const ASLFunFacts = ({ lessonType }) => {
  const [currentFact, setCurrentFact] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const getRandomFact = () => {
    // Start refresh animation
    setIsRefreshing(true);
    
    // Select a random fact or one specific to the lesson type
    let relevantFacts = aslFunFacts;
    
    // Filter facts by lesson type if needed
    if (lessonType === 'numbers') {
      relevantFacts = aslFunFacts.filter(fact => 
        fact.toLowerCase().includes('number') || 
        fact.match(/\d+/)
      );
    } else if (lessonType === 'alphabet') {
      relevantFacts = aslFunFacts.filter(fact => 
        fact.toLowerCase().includes('letter') || 
        fact.toLowerCase().includes('alphabet') ||
        fact.toLowerCase().includes('fingerspell')
      );
    }
    
    // If no relevant facts found, use all facts
    if (relevantFacts.length === 0) {
      relevantFacts = aslFunFacts;
    }
    
    // Choose a random fact from the filtered list
    let randomIndex;
    let newFact;
    
    // Make sure we don't get the same fact twice in a row
    do {
      randomIndex = Math.floor(Math.random() * relevantFacts.length);
      newFact = relevantFacts[randomIndex];
    } while (newFact === currentFact && relevantFacts.length > 1);
    
    setCurrentFact(newFact);
    
    // End refresh animation after a short delay
    setTimeout(() => setIsRefreshing(false), 500);
  };
  
  useEffect(() => {
    getRandomFact();
  }, [lessonType]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fun-fact-box">
      <div className="fun-fact-title">
        <FaLightbulb className="fun-fact-icon" /> Did You Know?
        <button 
          className={`fun-fact-refresh ${isRefreshing ? 'spinning' : ''}`}
          onClick={getRandomFact}
          title="Show another fun fact"
          aria-label="Show another fun fact"
        >
          <FaSyncAlt />
        </button>
      </div>
      <div className="fun-fact-content">
        {currentFact}
      </div>
    </div>
  );
};

export default ASLFunFacts; 