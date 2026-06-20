import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
// Configurar el worker de PDF.js para Vite usando CDN como fallback robusto
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

import { useScripts } from '../../hooks/useScripts';
import { improveCadence, translateToEnglish, englishPronunciationCoach, chatWithAi } from '../../services/groqService';
import './EditorView.css';

// Editor Nativo Súper Estable (sin ReactQuill)
const NativeRichTextEditor = ({ initialHTML, onChange }: { initialHTML: string, onChange: (html: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Inicializar contenido una sola vez
  useEffect(() => {
    if (editorRef.current && initialHTML) {
      editorRef.current.innerHTML = initialHTML;
    }
  }, []); // Solo al montar

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="native-editor-container">
      <div className="native-toolbar">
        <button type="button" onClick={() => execCommand('bold')} title="Negrita"><b>B</b></button>
        <button type="button" onClick={() => execCommand('italic')} title="Cursiva"><i>I</i></button>
        <button type="button" onClick={() => execCommand('underline')} title="Subrayado"><u>U</u></button>
        <button type="button" onClick={() => execCommand('strikeThrough')} title="Tachado"><s>S</s></button>
        <div className="toolbar-divider" />
        <button type="button" onClick={() => execCommand('justifyLeft')} title="Izquierda">←</button>
        <button type="button" onClick={() => execCommand('justifyCenter')} title="Centro">↔</button>
        <button type="button" onClick={() => execCommand('justifyRight')} title="Derecha">→</button>
        <div className="toolbar-divider" />
        <button type="button" onClick={() => execCommand('removeFormat')} title="Limpiar Formato">⌫</button>
      </div>
      <div 
        ref={editorRef}
        className="native-editor-content"
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder="Escribe tu guion aquí... (El texto se guarda automáticamente)"
      />
    </div>
  );
};

const AiChatInput = ({ onSend, isProcessing }: { onSend: (actionType: 'cadence' | 'translate' | 'coach' | 'free', promptText?: string) => void, isProcessing: boolean }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSend('free', inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="ai-chat-input-area">
      <div className="ai-chips">
        <button onClick={() => onSend('cadence')} disabled={isProcessing}>Mejorar Cadencia</button>
        <button onClick={() => onSend('translate')} disabled={isProcessing}>Traducir a Inglés</button>
        <button onClick={() => onSend('coach')} disabled={isProcessing}>Coach Pronunciación</button>
      </div>
      <form className="ai-input-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          placeholder="Ej: resume este párrafo..." 
          disabled={isProcessing}
        />
        <button type="submit" disabled={!inputValue.trim() || isProcessing}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export const EditorView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getScript, saveScript } = useScripts();

  const [scriptId, setScriptId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('Desconocido');
  const [isDragging, setIsDragging] = useState(false);
  
  // Ref para el componente nativo de carga de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [, setContentUpdater] = useState(0);
  const initialContentRef = useRef<string>('');
  const currentContentRef = useRef<string>('');
  const saveTimeoutRef = useRef<any>(null);

  interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    isActionable?: boolean;
  }

  // AI State
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'error' | 'success'} | null>(null);

  const showToast = React.useCallback((msg: string, type: 'error' | 'success' = 'error') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => {
    if (showAiSidebar) {
      setTimeout(scrollToBottom, 100);
    }
  }, [chatMessages, showAiSidebar]);

  // Initialize script
  useEffect(() => {
    if (id === 'new') {
      setScriptId(Date.now().toString());
      setIsEditorReady(true);
    } else if (id) {
      const existingScript = getScript(id);
      if (existingScript) {
        setScriptId(existingScript.id);
        setTitle(existingScript.title);
        
        let htmlContent = existingScript.content;
        // Si el texto es plano (por la versión anterior), lo convertimos a HTML básico
        if (!htmlContent.includes('<') && htmlContent.includes('\n')) {
          htmlContent = htmlContent.replace(/\n/g, '<br/>');
        }
        
        initialContentRef.current = htmlContent;
        currentContentRef.current = htmlContent;
        setIsEditorReady(true);
      } else {
        navigate('/'); // If not found, go back to dashboard
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // El autoguardado ahora se maneja directamente desde el onChange del editor
  const MOCK_SCRIPT = `Bienvenido al nuevo teleprompter. Este es el primer párrafo de nuestro texto de prueba. Como puedes ver, el diseño está pensado para que la lectura sea lo más cómoda y natural posible, sin distracciones innecesarias.<br/><br/>En este segundo párrafo, podemos notar cómo el interlineado amplio ayuda a que el ojo no se pierda al saltar de una línea a la siguiente. Un buen teleprompter no solo muestra texto, sino que guía la mirada del presentador con suavidad y precisión.<br/><br/>Finalmente, este tercer párrafo nos servirá para probar el desplazamiento continuo en el siguiente paso. Por ahora, concéntrate en ajustar el tamaño de la letra y familiarizarte con los controles de reproducción y velocidad ubicados en la parte inferior de la pantalla.`;

  const handleStartPrompter = () => {
    let finalContent = currentContentRef.current;
    let finalTitle = title;
    
    // Convert plain text empty check
    const plainTextContent = finalContent.replace(/<[^>]*>?/gm, '').trim();
    if (!plainTextContent) {
      finalContent = MOCK_SCRIPT;
      finalTitle = "Guion de Prueba";
    }

    // Force save immediately before navigating
    saveScript({
      id: scriptId,
      title: finalTitle,
      content: finalContent,
      lastEdited: Date.now(),
      ...(getScript(scriptId) && { 
        savedSpeed: getScript(scriptId)?.savedSpeed, 
        savedFontSize: getScript(scriptId)?.savedFontSize 
      })
    });
    navigate(`/player/${scriptId}`);
  };

  const detectLanguage = (text: string) => {
    const englishWords = /\b(the|is|and|to|in|it|you|that|he|was|for|on|are|with|as|I|his|they|be|at)\b/gi;
    const spanishWords = /\b(el|la|los|las|un|una|es|y|a|en|lo|tu|que|él|fue|para|por|son|con|como|yo|su|ellos|ser)\b/gi;
    
    const engCount = (text.match(englishWords) || []).length;
    const spaCount = (text.match(spanishWords) || []).length;

    if (engCount === 0 && spaCount === 0) return 'Desconocido';
    return engCount > spaCount ? 'Inglés' : 'Español';
  };

  const executeAiAction = React.useCallback(async (actionType: 'cadence' | 'translate' | 'coach' | 'free', promptText?: string) => {
    const plainText = currentContentRef.current.replace(/<[^>]*>?/gm, '').trim();
    if (!plainText) {
      showToast('El editor está vacío.', 'error');
      return;
    }

    // Add user message
    let userMsgText = '';
    if (actionType === 'cadence') userMsgText = 'Mejorar Cadencia y Pausas';
    else if (actionType === 'translate') userMsgText = 'Traducir a Inglés Fluido';
    else if (actionType === 'coach') userMsgText = 'Coach de Pronunciación';
    else if (actionType === 'free') userMsgText = promptText || '';

    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userMsgText };
    setChatMessages(prev => [...prev, newUserMsg]);
    setIsProcessingAi(true);

    try {
      let result = '';
      if (actionType === 'cadence') {
        result = await improveCadence(plainText);
      } else if (actionType === 'translate') {
        result = await translateToEnglish(plainText);
      } else if (actionType === 'coach') {
        result = await englishPronunciationCoach(plainText);
      } else if (actionType === 'free' && promptText) {
        result = await chatWithAi(plainText, promptText);
      }

      const newAiMsg: ChatMessage = { id: Date.now().toString() + 'ai', role: 'ai', content: result, isActionable: true };
      setChatMessages(prev => [...prev, newAiMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = { id: Date.now().toString() + 'err', role: 'ai', content: `Error: ${error.message || 'Fallo de IA.'}` };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessingAi(false);
    }
  }, [showToast]);

  const handleApplyToEditor = (content: string) => {
    const htmlFormattedText = content.replace(/\n/g, '<br/>');
    currentContentRef.current = htmlFormattedText;
    initialContentRef.current = htmlFormattedText;
    setContentUpdater(Date.now());
    setIsEditorReady(false);
    setTimeout(() => setIsEditorReady(true), 10);
  };

  const processFile = async (file: File) => {
    try {
      let text = '';
      if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (file.name.endsWith('.txt')) {
        text = await file.text();
      } else {
        showToast('Formato no soportado. Usa .txt, .pdf o .docx', 'error');
        return;
      }

      if (text) {
        const cleanedText = text.replace(/\r\n/g, '\n').replace(/\0/g, '');
        const htmlFormattedText = cleanedText.replace(/\n/g, '<br/>');
        
        currentContentRef.current = htmlFormattedText;
        initialContentRef.current = htmlFormattedText;
        setContentUpdater(Date.now());
        
        setDetectedLanguage(detectLanguage(cleanedText));
        
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
        
        setIsEditorReady(false);
        setTimeout(() => setIsEditorReady(true), 10);
        showToast('Documento importado con éxito', 'success');
      }
    } catch (error) {
      console.error("Detalle del error al procesar archivo:", error);
      showToast("Hubo un error al procesar el archivo.", 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Cálculo de palabras basado en el HTML actual convertido a texto plano
  const currentPlainText = currentContentRef.current.replace(/<[^>]*>?/gm, '');
  const wordCount = currentPlainText.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
  const estimatedMin = Math.floor(wordCount / 130);
  const estimatedSec = Math.floor(((wordCount / 130) * 60) % 60).toString().padStart(2, '0');

  return (
    <div 
      className={`editor-container ${isDragging ? 'drag-active' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header className="editor-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Dashboard
        </button>
        <div className="header-actions">
          <span className="lang-badge">
            Tiempo est: {estimatedMin}:{estimatedSec} min
          </span>
          {detectedLanguage !== 'Desconocido' && (
            <span className="lang-badge">Idioma: {detectedLanguage}</span>
          )}
          <span className="save-status">{isSaving ? 'Guardando...' : 'Guardado'}</span>
          
          <input 
            type="file" 
            accept=".txt,.pdf,.docx" 
            ref={fileInputRef} 
            onChange={handleImportFile} 
            style={{ display: 'none' }} 
          />
          <button 
            className="secondary-btn" 
            onClick={() => fileInputRef.current?.click()}
            title="Importar archivo .txt, .pdf o .docx"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Importar Documento
          </button>

          {/* AI Assistant Toggle */}
          <button 
            className="secondary-btn" 
            onClick={() => setShowAiSidebar(!showAiSidebar)}
            title="Asistente IA"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
              <path d="m14 7 3 3"/>
              <path d="M5 6v4"/>
              <path d="M19 14v4"/>
              <path d="M10 2v2"/>
              <path d="M7 8H3"/>
              <path d="M21 16h-4"/>
              <path d="M11 3H9"/>
            </svg>
            Asistente IA
          </button>

          <button className="primary-btn" onClick={handleStartPrompter}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Iniciar Prompter
          </button>
        </div>
      </header>

      <div className="editor-content-wrapper">
        <main className="editor-main">
          <input 
            className="editor-title" 
            type="text" 
            placeholder="Título del guion..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="quill-wrapper">
            {isEditorReady && (
              <NativeRichTextEditor 
                initialHTML={initialContentRef.current}
                onChange={(value) => {
                  currentContentRef.current = value;
                  
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                  setIsSaving(true);
                  
                  saveTimeoutRef.current = setTimeout(() => {
                    saveScript({
                      id: scriptId,
                      title: title,
                      content: value,
                      lastEdited: Date.now(),
                      ...(getScript(scriptId) && { 
                        savedSpeed: getScript(scriptId)?.savedSpeed, 
                        savedFontSize: getScript(scriptId)?.savedFontSize 
                      })
                    });
                    setIsSaving(false);
                  }, 1000);
                }} 
              />
            )}
          </div>
        </main>

        {showAiSidebar && (
          <aside className="ai-sidebar">
            <div className="ai-sidebar-header">
              <h3>Chat Copilot</h3>
              <button className="close-btn" onClick={() => setShowAiSidebar(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="ai-chat-history">
              {chatMessages.length === 0 && (
                <div className="ai-welcome">
                  <p>Hola, soy tu asistente de guiones. Usa los botones abajo o escríbeme lo que necesitas.</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.role}`}>
                  <div className="message-bubble">{msg.content}</div>
                  {msg.isActionable && (
                    <button className="apply-btn" onClick={() => handleApplyToEditor(msg.content)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Reemplazar en el editor
                    </button>
                  )}
                </div>
              ))}
              {isProcessingAi && (
                <div className="chat-message ai processing">
                  <div className="message-bubble loading-bubble">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <AiChatInput onSend={executeAiAction} isProcessing={isProcessingAi} />
          </aside>
        )}
      </div>
      
      {toastMessage && (
        <div className={`toast-container ${toastMessage.type}`}>
          {toastMessage.msg}
        </div>
      )}
    </div>
  );
};
