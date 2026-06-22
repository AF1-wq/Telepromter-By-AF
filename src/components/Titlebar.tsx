import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Titlebar: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="titlebar-container">
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
      <div className="titlebar-text">
        Teleprompter by AF
      </div>
    </div>
  );
};
