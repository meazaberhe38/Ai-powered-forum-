import React, { createContext, useContext, useEffect, useState } from 'react';

// Create a context for theme management
const ThemeContext = createContext(undefined);

/**
 * Get the initial theme from localStorage or system preference.
 * This ensures the state matches what's already applied to the DOM.
 */
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (e) {
    // Fallback if localStorage is not available
    return 'light';
  }
}

/**
 * ThemeProvider component that wraps the app and provides theme state.
 * It sets a data attribute on the <html> element to allow CSS custom property overrides.
 */
export function ThemeProvider({ children }) {
  // Initialize with the theme that's already applied to the DOM
  const [theme, setTheme] = useState(getInitialTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  // One-time initialization to sync with DOM
  useEffect(() => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    
    // If DOM already has a theme (from blocking script), use it
    if (currentTheme && (currentTheme === 'dark' || currentTheme === 'light')) {
      setTheme(currentTheme);
    } else {
      // Otherwise, apply our initial theme
      html.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
    
    setIsInitialized(true);
  }, []);

  // Update DOM and localStorage whenever theme changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook to consume the ThemeContext */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
