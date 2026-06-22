import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Titlebar: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '44px',
      backgroundColor: 'rgba(28, 28, 32, 0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF5F57', border: 'none', cursor: 'pointer' }} 
          title="Cerrar / Dashboard" 
        />
        <button 
          style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FEBC2E', border: 'none', cursor: 'pointer' }} 
          title="Minimizar" 
        />
        <button 
          style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28C840', border: 'none', cursor: 'pointer' }} 
          title="Maximizar" 
        />
      </div>
      <div style={{ flex: 1, textAlign: 'center', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 600 }}>
        Teleprompter by AF
      </div>
    </div>
  );
};
