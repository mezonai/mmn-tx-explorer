'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <Button variant="outline" size="icon" className="relative overflow-hidden" onClick={toggleTheme}>
      <Sun
        className={`h-[1.2rem] w-[1.2rem] text-amber-500 transition-all duration-300 ${
          isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0'
        }`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] text-sky-400 transition-all duration-300 ${
          isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
        }`}
      />
      <span className="sr-only">{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
    </Button>
  );
}
