import React, { useState, useEffect } from 'react';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('groq_api_key') || '';
      setApiKey(storedKey);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('groq_api_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Configuración de IA</h2>
          <button className="settings-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="settings-modal-body">
          <p className="settings-description">
            Para utilizar las funciones de Inteligencia Artificial (mejorar cadencia, traducir, etc.), necesitas configurar tu propia API Key de Groq.
          </p>
          <div className="form-group">
            <label htmlFor="apiKey">Groq API Key</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              autoComplete="off"
            />
            <small className="help-text">
              Tu llave se guardará de forma segura en tu navegador local (LocalStorage). No se enviará a ningún servidor nuestro.
            </small>
          </div>
          <div className="settings-actions">
            <button className="btn-save" onClick={handleSave}>Guardar</button>
            {saved && <span className="save-success">¡Guardado!</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
