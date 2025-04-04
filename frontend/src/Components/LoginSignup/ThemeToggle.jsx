import { useTheme } from './ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
      onClick={toggleTheme}
    >
      <span className="toggle-icon">
        {isDarkMode ? '🌞' : '🌙'}
      </span>
    </button>
  );
};

export default ThemeToggle;