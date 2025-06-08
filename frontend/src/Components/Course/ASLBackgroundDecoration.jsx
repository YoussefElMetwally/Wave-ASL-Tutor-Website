import React, { useEffect, useState } from 'react';
import './Course.css';

// Hand shapes representing ASL fingerspelling
const handEmojis = ['👋', '👌', '✌️', '🤟', '👍', '👐', '✊', '👉', '🖐️', '✋'];

const ASLBackgroundDecoration = ({ isDarkMode }) => {
  const [decorations, setDecorations] = useState([]);

  useEffect(() => {
    // Generate ASL-themed background decorations with better spacing
    const generateDecorations = () => {
      const items = [];
      
      // Create a grid system for more evenly distributed decorations
      const gridCells = 4; // 4x4 grid (16 cells)
      const cellWidth = 100 / gridCells;
      const cellHeight = 100 / gridCells;
      
      // Keep track of used grid cells to avoid overcrowding
      const usedCells = new Set();
      
      // Function to get a random position within a specific grid cell
      const getPositionInCell = (cellX, cellY) => {
        // Add some padding to keep elements away from grid edges
        const padding = 5;
        const x = cellX * cellWidth + padding + Math.random() * (cellWidth - padding * 2);
        const y = cellY * cellHeight + padding + Math.random() * (cellHeight - padding * 2);
        return { x, y };
      };
      
      // Function to get a random unused grid cell
      const getRandomCell = () => {
        let attempts = 0;
        let cellX, cellY;
        
        do {
          cellX = Math.floor(Math.random() * gridCells);
          cellY = Math.floor(Math.random() * gridCells);
          attempts++;
          
          // If we've tried too many times, just return the last attempt
          if (attempts > 20) break;
        } while (usedCells.has(`${cellX},${cellY}`));
        
        usedCells.add(`${cellX},${cellY}`);
        return { cellX, cellY };
      };
      
      // Add a limited set of alphabet letters (not all 26)
      const selectedLetters = ['A', 'B', 'L', 'S', 'Z', 'E', 'J', 'T', 'W', 'R'];
      selectedLetters.forEach((letter, index) => {
        const { cellX, cellY } = getRandomCell();
        const { x, y } = getPositionInCell(cellX, cellY);
        
        items.push({
          symbol: letter,
          top: `${y}%`,
          left: `${x}%`,
          rotate: `${Math.random() * 30 - 15}deg`,
          scale: 0.4 + Math.random() * 0.3, // Reduced scale
          index: index,
          type: 'letter'
        });
      });
      
      // Add a limited set of numbers
      const selectedNumbers = ['1', '2', '5', '7', '9'];
      selectedNumbers.forEach((number, index) => {
        const { cellX, cellY } = getRandomCell();
        const { x, y } = getPositionInCell(cellX, cellY);
        
        items.push({
          symbol: number,
          top: `${y}%`,
          left: `${x}%`,
          rotate: `${Math.random() * 30 - 15}deg`,
          scale: 0.3 + Math.random() * 0.3, // Reduced scale
          index: index + 10,
          type: 'number'
        });
      });
      
      // Add hand emojis for more visual interest (limited selection)
      const selectedEmojis = handEmojis.slice(0, 5); // Just use 5 emojis
      selectedEmojis.forEach((emoji, index) => {
        const { cellX, cellY } = getRandomCell();
        const { x, y } = getPositionInCell(cellX, cellY);
        
        items.push({
          symbol: emoji,
          top: `${y}%`,
          left: `${x}%`,
          rotate: `${Math.random() * 30 - 15}deg`,
          scale: 0.4 + Math.random() * 0.3, // Reduced scale
          index: index + 15,
          type: 'emoji'
        });
      });
      
      return items;
    };
    
    setDecorations(generateDecorations());
  }, []);

  // Define the opacity value here so you can easily adjust it
  const backgroundOpacity = 0.002; // Extremely reduced opacity - barely visible

  // Uncomment this line to completely hide decorations
  // return null;

  return (
    <div className="asl-background-decoration" style={{ 
      opacity: backgroundOpacity,
      filter: 'blur(1px)'
    }}>
      {decorations.map((decoration, index) => (
        <div
          key={index}
          className={`asl-decoration-item ${isDarkMode ? 'dark-mode' : 'light-mode'} ${decoration.type}`}
          style={{
            top: decoration.top,
            left: decoration.left,
            transform: `rotate(${decoration.rotate}) scale(${decoration.scale})`,
            '--rotation': decoration.rotate,
            '--index': decoration.index,
            filter: 'blur(0.9px)',
          }}
        >
          {decoration.symbol}
        </div>
      ))}
    </div>
  );
};

export default ASLBackgroundDecoration;