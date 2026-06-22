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
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <p><strong>1. Transparencia y Privacidad por Diseño</strong><br/>En Teleprompter by AF, tu privacidad es nuestra prioridad absoluta. Nuestra aplicación ha sido construida bajo el principio de 'Privacidad por Diseño'. Esto significa que no almacenamos, no guardamos y no tenemos bases de datos con los guiones o textos que escribes en nuestra plataforma.</p>
            <p><strong>2. ¿Cómo funciona nuestra Inteligencia Artificial?</strong><br/>Cuando utilizas las herramientas de asistencia de IA (como 'Mejorar Cadencia', 'Coach de Pronunciación' o 'Traducir'), tu texto no se procesa localmente. El texto seleccionado se envía de forma encriptada a nuestro servidor privado. Nuestro servidor se comunica exclusivamente con nuestro proveedor de Inteligencia Artificial (Groq) para procesar tu solicitud. Una vez que la IA devuelve la respuesta, tu texto original y la respuesta son eliminados inmediatamente de la memoria de nuestro servidor.</p>
            <p><strong>3. Uso de tus datos</strong><br/>- Sin retención de datos: Ningún guion o documento que insertes en el teleprompter se guarda en nuestros servidores al finalizar la sesión.<br/>- Sin entrenamiento de IA: Garantizamos que los textos que envías no son utilizados para entrenar modelos de lenguaje públicos o privados.</p>
            <p><strong>4. Proveedores de Infraestructura</strong><br/>Nos apoyamos en infraestructuras líderes: Render (para nuestro servidor de conexión seguro) y Groq (motor de procesamiento de IA). Ambas plataformas operan bajo estrictos estándares de seguridad y encriptación.</p>
            <p><strong>5. Propiedad Intelectual y Derechos de Autor (Copyright)</strong><br/>El usuario es el único responsable del contenido (textos, guiones, documentos o archivos PDF) que introduzca, importe o procese en la aplicación. Teleprompter by AF y su desarrollador no asumen ninguna responsabilidad por infracciones de derechos de autor, plagio o uso indebido de material protegido por propiedad intelectual realizado por los usuarios. Al importar un documento, el usuario declara tener los derechos necesarios sobre el mismo.</p>
            <p><strong>6. Limitación de Responsabilidad (Exención Legal)</strong><br/>Esta herramienta se proporciona "tal cual" (as is) y "según disponibilidad". El desarrollador se exime de toda responsabilidad civil, penal o comercial derivada del uso, mal uso o incapacidad de uso de la aplicación. Esto incluye, pero no se limita a, la pérdida de información, interrupciones del servicio, o cualquier daño directo o indirecto resultante de decisiones tomadas en base a las funciones de IA.</p>
            <p><strong>7. Responsabilidad del Usuario</strong><br/>Te recomendamos aplicar el sentido común: evita introducir contraseñas o datos personales altamente sensibles en el editor. El uso de esta herramienta y sus resultados es bajo tu propia y estricta responsabilidad.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
