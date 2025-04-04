import { useEffect } from 'react';
import { useTheme } from './ThemeContext';
import ThemeToggle from './ThemeToggle';

const Layout = ({ children }) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="app-container">
      <ThemeToggle />
      {children}
    </div>
  );
};

export default Layout;