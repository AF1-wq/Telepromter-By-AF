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
            <strong>1. Transparencia y Privacidad por Diseño:</strong> En Teleprompter by AF, tu privacidad es nuestra prioridad absoluta. No almacenamos, no guardamos y no tenemos bases de datos con tus guiones.
          </p>
          <p>
            <strong>2. Inteligencia Artificial:</strong> El texto se envía de forma encriptada a nuestro servidor privado y a Groq. Al devolver la respuesta, tu texto original y la respuesta son eliminados INMEDIATAMENTE de la memoria de nuestro servidor. No usamos tus datos para entrenar IA.
          </p>
          <p>
            <strong>3. Limitación de Responsabilidad y Copyright:</strong> El usuario es el único responsable del contenido y derechos de autor de los documentos (PDF/Word) que importe. Esta herramienta se proporciona "tal cual" y el desarrollador se exime de toda responsabilidad legal, civil o penal derivada de su uso o del uso de la IA.
          </p>
        </div>
      </div>
    </div>
  );
};
