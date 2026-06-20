import React from 'react';
import './LegalModal.css';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="legal-modal-backdrop" onClick={onClose}>
      <div className="legal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal-header">
          <h2>Términos y Privacidad</h2>
          <button className="legal-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="legal-modal-body">
          <p>
            <strong>Privacidad y Almacenamiento:</strong> "Esta aplicación no utiliza bases de datos en la nube. Todos sus guiones y configuraciones se guardan físicamente en la memoria de su navegador actual (LocalStorage). Si usted borra el caché de su navegador, utiliza el modo Incógnito o cambia de dispositivo, sus datos no se sincronizarán y se perderán. Nosotros no recopilamos, leemos ni tenemos acceso a su información."
          </p>
          <p>
            <strong>Uso de IA:</strong> "El Asistente de IA utiliza servicios de terceros (API de Groq/Llama). Al usar estas funciones, el texto seleccionado se procesa temporalmente de forma externa. La IA puede generar resultados inexactos."
          </p>
          <p>
            <strong>Archivos y Copyright:</strong> "El usuario es enteramente responsable de poseer los derechos de autor de cualquier documento (PDF/Word) que decida importar y procesar en esta herramienta. El desarrollador se exime de toda responsabilidad legal."
          </p>
        </div>
      </div>
    </div>
  );
};
