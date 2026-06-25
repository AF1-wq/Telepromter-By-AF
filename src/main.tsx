import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/tailwind.css';
import './styles/variables.css';
import './styles/globals.css';
import { ThemeProvider } from './hooks/useTheme.ts';

// Apply saved theme synchronously BEFORE first paint — eliminates flash
(function () {
  try {
    const saved = localStorage.getItem('app-theme');
    const theme = saved === 'light' ? 'light' : 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch { /* ignore */ }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
