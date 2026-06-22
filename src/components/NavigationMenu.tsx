import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useReadingMode } from '../hooks/useReadingMode';
import { useBionicMode } from '../hooks/useBionicMode';
import { LegalModal } from './LegalModal';
import './NavigationMenu.css';

export const NavigationMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { mode, setMode } = useReadingMode();
  const { bionicMode, setBionicMode } = useBionicMode();
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        className={`nav-hamburger z-50 ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Menú Principal"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {isOpen && <div className="nav-backdrop" onClick={() => setIsOpen(false)} />}

      <div className={`nav-sidebar z-50 ${isOpen ? 'open' : ''}`}>
        <div className="nav-sidebar-header">
          <h2>Teleprompter by AF</h2>
        </div>
        <div className="nav-sidebar-content">
          <div className="nav-section">
            <h3>Navegación</h3>
            <button className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`} onClick={() => handleNavigate('/')}>
              Mis Guiones
            </button>
            <button className={`nav-btn ${location.pathname === '/editor/new' ? 'active' : ''}`} onClick={() => handleNavigate('/editor/new')}>
              Crear Nuevo
            </button>
          </div>

          <div className="nav-section">
            <h3>Apariencia</h3>
            <button className="nav-btn theme-btn" onClick={toggleTheme}>
              {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.25rem', height: '1.25rem' }}>
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.25rem', height: '1.25rem' }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>

          {location.pathname.startsWith('/player') && (
            <div className="nav-section">
              <h3>Modo de Lectura</h3>
              <select className="nav-select" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                <option value="standard">Estándar</option>
                <option value="pro">Alto Contraste</option>
                <option value="focus">Enfoque (Línea)</option>
                <option value="accessibility">Accesibilidad</option>
              </select>
            </div>
          )}

          {location.pathname.startsWith('/player') && (
            <div className="nav-section">
              <h3>Asistente de Lectura</h3>
              <button className={`nav-btn ${bionicMode ? 'active' : ''}`} onClick={() => setBionicMode(!bionicMode)}>
                Lectura Biónica (Inglés)
                {bionicMode ? ' (On)' : ' (Off)'}
              </button>
            </div>
          )}

          <div className="nav-section" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button className="nav-btn" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', opacity: 0.8 }} onClick={() => setIsLegalModalOpen(true)}>
              Términos y Privacidad
            </button>
          </div>
        </div>
      </div>

      <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
    </>
  );
};
