import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

import { useScripts } from '../../hooks/useScripts';
import { useTheme } from '../../hooks/useTheme';
import { improveCadence, translateToEnglish, englishPronunciationCoach, chatWithAi } from '../../services/groqService';
import { ArrowLeft, Clock, Save, Upload, Zap, Play, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, X } from 'lucide-react';
import { S, Sidebar, PrimaryButton, GhostButton, ToolbarBtn } from '../../components/ui/SharedComponents';
import './EditorView.css'; // Mantenemos para estilos muy específicos si quedan

const estimateMinutes = (text: string) =>
  Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 130) || 0;

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const wordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

const formatDate = (d: Date) =>
  d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isActionable?: boolean;
}

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
    <div className="ai-chat-input-area" style={{ borderTop: '1px solid var(--border)', padding: '15px' }}>
      <div className="ai-chips flex flex-wrap gap-2 mb-3">
        <button onClick={() => onSend('cadence')} disabled={isProcessing} className="text-[10px] bg-secondary px-2 py-1 rounded">Mejorar Cadencia</button>
        <button onClick={() => onSend('translate')} disabled={isProcessing} className="text-[10px] bg-secondary px-2 py-1 rounded">Traducir a Inglés</button>
        <button onClick={() => onSend('coach')} disabled={isProcessing} className="text-[10px] bg-secondary px-2 py-1 rounded">Coach Pronunciación</button>
      </div>
      <form className="ai-input-form flex gap-2" onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          placeholder="Ej: resume este párrafo..." 
          disabled={isProcessing}
          className="flex-1 text-xs px-3 py-2 outline-none"
          style={{ ...S.input }}
        />
        <button type="submit" disabled={!inputValue.trim() || isProcessing} className="text-primary disabled:opacity-50">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  const [scriptId, setScriptId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('Desconocido');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [, setContentUpdater] = useState(0);
  const initialContentRef = useRef<string>('');
  const currentContentRef = useRef<string>('');
  const saveTimeoutRef = useRef<any>(null);

  const [displayWords, setDisplayWords] = useState(0);

  // AI State
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'error' | 'success'} | null>(null);

  const showToast = useCallback((msg: string, type: 'error' | 'success' = 'error') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        if (!htmlContent.includes('<') && htmlContent.includes('\n')) {
          htmlContent = htmlContent.replace(/\n/g, '<br/>');
        }
        
        initialContentRef.current = htmlContent;
        currentContentRef.current = htmlContent;
        setDisplayWords(wordCount(stripHtml(htmlContent)));
        setIsEditorReady(true);
      } else {
        navigate('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      editorRef.current.innerHTML = initialContentRef.current;
    }
  }, [isEditorReady]);

  const MOCK_SCRIPT = `Bienvenido al nuevo teleprompter. Este es el primer párrafo de nuestro texto de prueba.`;

  const handleStartPrompter = () => {
    let finalContent = currentContentRef.current;
    let finalTitle = title;
    
    const plainTextContent = finalContent.replace(/<[^>]*>?/gm, '').trim();
    if (!plainTextContent) {
      finalContent = MOCK_SCRIPT;
      finalTitle = "Guion de Prueba";
    }

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

  const executeAiAction = useCallback(async (actionType: 'cadence' | 'translate' | 'coach' | 'free', promptText?: string) => {
    const plainText = currentContentRef.current.replace(/<[^>]*>?/gm, '').trim();
    if (!plainText) {
      showToast('El editor está vacío.', 'error');
      return;
    }

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
      if (actionType === 'cadence') result = await improveCadence(plainText);
      else if (actionType === 'translate') result = await translateToEnglish(plainText);
      else if (actionType === 'coach') result = await englishPronunciationCoach(plainText);
      else if (actionType === 'free' && promptText) result = await chatWithAi(plainText, promptText);

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
    setDisplayWords(wordCount(stripHtml(htmlFormattedText)));
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
        setDisplayWords(wordCount(stripHtml(htmlFormattedText)));
        setDetectedLanguage(detectLanguage(cleanedText));
        
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
        
        setIsEditorReady(false);
        setTimeout(() => setIsEditorReady(true), 10);
        showToast('Documento importado con éxito', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast("Hubo un error al procesar el archivo.", 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    currentContentRef.current = html;
    setContentUpdater(Date.now());
    
    const wc = wordCount(stripHtml(html));
    if (wc !== displayWords) setDisplayWords(wc);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    
    saveTimeoutRef.current = setTimeout(() => {
      saveScript({
        id: scriptId,
        title: title,
        content: html,
        lastEdited: Date.now(),
        ...(getScript(scriptId) && { 
          savedSpeed: getScript(scriptId)?.savedSpeed, 
          savedFontSize: getScript(scriptId)?.savedFontSize 
        })
      });
      setIsSaving(false);
    }, 1000);
  };

  const exec = (cmd: string) => {
    document.execCommand(cmd, false);
    editorRef.current?.focus();
    handleInput();
  };

  const mins = estimateMinutes(stripHtml(currentContentRef.current));
  const scriptObj = getScript(scriptId);

  return (
    <div className="flex h-full view-in">
      <Sidebar dark={dark} onToggleDark={toggleTheme} activeView="editor" onCreate={() => {}} onGoLibrary={() => navigate('/')} />
      
      <div 
        className={`flex-1 flex flex-col overflow-hidden min-w-0 ${isDragging ? 'opacity-50 ring-2 ring-primary ring-inset' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <header className="flex items-center justify-between px-5 py-2.5" style={S.toolbar}>
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={13} strokeWidth={2.5} />Biblioteca
          </button>

          <div className="flex items-center gap-5 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              <Clock size={11} />{mins} min
            </span>
            {detectedLanguage !== 'Desconocido' && (
              <span className="text-muted-foreground border border-border px-1.5 py-0.5 rounded">{detectedLanguage}</span>
            )}
            <span style={{ color: !isSaving ? "var(--muted-foreground)" : "var(--status-warning)", transition: "color 0.3s ease" }}>
              {!isSaving ? "Guardado" : "Guardando..."}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <GhostButton onClick={() => {}} icon={<Save size={12} />} label="Guardar" />
            
            <input type="file" accept=".txt,.pdf,.docx" ref={fileInputRef} onChange={handleImportFile} style={{ display: 'none' }} />
            <GhostButton onClick={() => fileInputRef.current?.click()} icon={<Upload size={12} />} label="Importar" />
            
            <GhostButton onClick={() => setShowAiSidebar(!showAiSidebar)} icon={<Zap size={12} />} label="IA" />
            <PrimaryButton onClick={handleStartPrompter} icon={<Play size={11} fill="currentColor" />} label="Iniciar" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto editor-scroll px-6 py-8 flex">
          <div className="max-w-2xl mx-auto flex-1 transition-all">
            <div className="relative glass-noise" style={{ borderRadius: "calc(var(--radius) + 6px)", overflow: "hidden", ...S.panelGlass }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--glass-toolbar-border)", background: "color-mix(in srgb, var(--glass-panel-inset) 20%, transparent)" }}>
                {/* Apple Traffic Lights */}
                <div className="flex items-center gap-1.5 mr-2">
                  {(["--traffic-red", "--traffic-yellow", "--traffic-green"] as const).map(v => (
                    <div key={v} style={{ width: 12, height: 12, borderRadius: "50%", background: `var(${v})`, opacity: 0.85 }} />
                  ))}
                </div>
                <div className="flex items-center gap-0.5 ml-1">
                  {[
                    { icon: <Bold size={11} />, cmd: "bold", title: "Negrita" },
                    { icon: <Italic size={11} />, cmd: "italic", title: "Cursiva" },
                    { icon: <Underline size={11} />, cmd: "underline", title: "Subrayado" },
                  ].map(({ icon, cmd, title }) => (
                    <ToolbarBtn key={cmd} onClick={() => exec(cmd)} title={title}>{icon}</ToolbarBtn>
                  ))}
                  <div className="w-px h-3.5 mx-1" style={{ background: "var(--glass-divider)" }} />
                  {[
                    { icon: <AlignLeft size={11} />, cmd: "justifyLeft", title: "Izquierda" },
                    { icon: <AlignCenter size={11} />, cmd: "justifyCenter", title: "Centro" },
                    { icon: <AlignRight size={11} />, cmd: "justifyRight", title: "Derecha" },
                  ].map(({ icon, cmd, title }) => (
                    <ToolbarBtn key={cmd} onClick={() => exec(cmd)} title={title}>{icon}</ToolbarBtn>
                  ))}
                </div>
              </div>

              <div className="px-9 pt-8 pb-2">
                <input
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    saveScript({
                      id: scriptId,
                      title: e.target.value,
                      content: currentContentRef.current,
                      lastEdited: Date.now(),
                      ...(getScript(scriptId) && { 
                        savedSpeed: getScript(scriptId)?.savedSpeed, 
                        savedFontSize: getScript(scriptId)?.savedFontSize 
                      })
                    });
                  }}
                  className="w-full bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
                  style={{ letterSpacing: "-0.025em", fontFamily: "var(--font-ui)" }}
                  placeholder="Título del guion..."
                />
              </div>

              <div className="px-9 pb-10">
                {isEditorReady && (
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onBlur={handleInput}
                    className="min-h-[300px] outline-none text-foreground"
                    style={{ fontFamily: "var(--font-reading)", fontSize: "16px", lineHeight: "1.9" }}
                    data-placeholder="Escribe tu guion aquí..."
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-[11px] text-muted-foreground word-tick" style={{ fontFamily: "var(--font-mono)" }}>
                {displayWords.toLocaleString("es-ES")} palabras
              </span>
              <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                {scriptObj ? `Editado ${formatDate(new Date(scriptObj.lastEdited))}` : ''}
              </span>
            </div>
          </div>

          {/* AI Sidebar */}
          {showAiSidebar && (
            <aside className="w-80 ml-6 flex flex-col rounded-xl overflow-hidden glass-noise" style={{ ...S.panelGlass }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Chat Copilot</h3>
                <button onClick={() => setShowAiSidebar(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs">
                {chatMessages.length === 0 && (
                  <div className="text-muted-foreground text-center py-4">Hola, soy tu asistente de guiones. Usa los botones abajo o escríbeme lo que necesitas.</div>
                )}
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {msg.content}
                      {msg.isActionable && (
                        <button onClick={() => handleApplyToEditor(msg.content)} className="mt-2 text-[10px] flex items-center gap-1 bg-background text-foreground px-2 py-1 rounded">
                          Reemplazar en el editor
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessingAi && (
                  <div className="flex justify-start">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">Procesando...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <AiChatInput onSend={executeAiAction} isProcessing={isProcessingAi} />
            </aside>
          )}
        </div>
      </div>
      
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white text-xs ${toastMessage.type === 'error' ? 'bg-destructive' : 'bg-green-600'}`} style={{ zIndex: 100 }}>
          {toastMessage.msg}
        </div>
      )}
    </div>
  );
};
