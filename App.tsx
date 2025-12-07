import React, { useState, useRef, useEffect } from 'react';
import { JsonDisplayRef } from './components/JsonDisplay';
import { convertPdfToImages } from './utils/pdfUtils';
import { analyzePaper, chatWithPaper } from './services/geminiService';
import { trackEvent } from './services/analytics';
import { Message, PaperAnalysis, AppState } from './types';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'System Initialized. Upload a PDF or paste text to begin multimodal analysis.',
      timestamp: Date.now()
    }
  ]);
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [inputText, setInputText] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [showStickyActions, setShowStickyActions] = useState(false);
  const [stickyCopied, setStickyCopied] = useState(false);
  const [errorDetail, setErrorDetail] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const jsonDisplayRef = useRef<JsonDisplayRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Ref to track the current analysis session ID. 
  // If the user cancels, we increment this to ignore results from the stale promise.
  const analysisIdRef = useRef<number>(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
        // Threshold: 200px. If scrolled past, show sticky actions.
        const shouldShow = scrollContainerRef.current.scrollTop > 200;
        if (shouldShow !== showStickyActions) {
            setShowStickyActions(shouldShow);
        }
    }
  };

  const addMessage = (role: Message['role'], content: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      role,
      content,
      timestamp: Date.now()
    }]);
  };

  const handleInputSubmit = async () => {
    if (!inputText.trim()) return;

    // Mode 1: Interactive Chat (Post-Analysis)
    if (analysis && appState === AppState.COMPLETE) {
      const userQuery = inputText;
      setInputText('');
      setIsChatting(true);
      addMessage('user', userQuery);
      
      trackEvent('chat_query_sent', { query_length: userQuery.length });

      try {
        const response = await chatWithPaper(analysis, userQuery, messages);
        addMessage('assistant', response);
        trackEvent('chat_response_received', { response_length: response.length });
      } catch (error: any) {
        addMessage('assistant', `Error: ${error.message}`);
        trackEvent('chat_error', { message: error.message });
      }
      setIsChatting(false);
      return;
    }

    // Mode 2: Raw Text Analysis (Pre-Analysis)
    handleTextAnalyze();
  };

  const handleTextAnalyze = async () => {
    if (!inputText.trim()) return;

    const currentId = Date.now();
    analysisIdRef.current = currentId;

    const textToAnalyze = inputText;
    trackEvent('analyze_text_submitted', { text_length: textToAnalyze.length });

    setAnalysis(null);
    setSelectedFiles([]);
    setAppState(AppState.ANALYZING);
    setShowStickyActions(false);
    setErrorDetail(null);
    
    addMessage('user', 'Submitted text for analysis.');
    addMessage('assistant', 'Analyzing text content...');
    
    setInputText('');

    try {
      const result = await analyzePaper({ text: textToAnalyze });
      
      // Guard: Check if this process is still active (not cancelled/superseded)
      if (analysisIdRef.current !== currentId) return;

      setAnalysis(result);
      setAppState(AppState.COMPLETE);
      addMessage('assistant', 'Analysis complete. You can now ask questions about the paper below.');
      trackEvent('analyze_text_completed', { success: true, paper_title: result.paper_title });
    } catch (error: any) {
      if (analysisIdRef.current !== currentId) return;
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorDetail(error);
      addMessage('assistant', `Error processing text: ${error.message || 'Unknown error'}`);
      trackEvent('analyze_text_failed', { message: error.message });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      
      if (newFiles.length === 0) {
         addMessage('system', 'Please upload valid PDF files.');
         return;
      }

      setSelectedFiles(prev => [...prev, ...newFiles]);
      trackEvent('files_selected', { count: newFiles.length });
      
      // Reset input so duplicate selection is possible if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeFiles = async () => {
    if (selectedFiles.length === 0) return;

    const currentId = Date.now();
    analysisIdRef.current = currentId;

    setAppState(AppState.PROCESSING_PDF);
    setShowStickyActions(false);
    setErrorDetail(null);
    const fileNames = selectedFiles.map(f => f.name).join(', ');
    addMessage('user', `Uploaded ${selectedFiles.length} document(s): ${fileNames}`);
    addMessage('assistant', `Processing ${selectedFiles.length} document(s) for multimodal analysis...`);
    trackEvent('batch_analysis_started', { file_count: selectedFiles.length });

    try {
      // Convert all PDFs to images in parallel
      const allImagesArrays = await Promise.all(selectedFiles.map(f => convertPdfToImages(f)));
      
      if (analysisIdRef.current !== currentId) return;

      const images = allImagesArrays.flat();
      
      setAppState(AppState.ANALYZING);
      addMessage('assistant', `Derendering documents (${images.length} total pages) and interpreting visuals...`);
      
      const result = await analyzePaper({ images });
      
      if (analysisIdRef.current !== currentId) return;
      
      setAnalysis(result);
      setAppState(AppState.COMPLETE);
      addMessage('assistant', 'Analysis complete. Structured data extracted.');
      addMessage('assistant', 'System is ready for Q&A. Type below to query the documents.');
      
      trackEvent('analyze_pdf_completed', { page_count: images.length, paper_title: result.paper_title });

    } catch (error: any) {
      if (analysisIdRef.current !== currentId) return;
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorDetail(error);
      addMessage('assistant', `Error processing documents: ${error.message || 'Unknown error'}`);
      trackEvent('analyze_pdf_failed', { message: error.message });
    }
  };

  const handleCancelAnalysis = () => {
    // Invalidate the current analysis ID
    analysisIdRef.current = 0;
    
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setErrorDetail(null);
    setShowStickyActions(false);
    addMessage('system', 'Analysis process cancelled by user.');
    trackEvent('analysis_cancelled');
  };

  const handleReset = () => {
    trackEvent('app_reset');
    setAnalysis(null);
    setSelectedFiles([]);
    setErrorDetail(null);
    setAppState(AppState.IDLE);
    setShowStickyActions(false);
    analysisIdRef.current = 0;
    setMessages([{
      id: 'reset',
      role: 'system',
      content: 'Context cleared. Ready for new input.',
      timestamp: Date.now()
    }]);
  };

  const getHeaderText = () => {
    if (!analysis) return 'System Ready';
    if (selectedFiles.length === 1) return `FILE: ${selectedFiles[0].name}`;
    if (selectedFiles.length > 1) return `FILES: ${selectedFiles.length} Documents`;
    return 'TEXT ANALYSIS';
  };

  const handleStickyCopyJson = async () => {
    if (jsonDisplayRef.current) {
        await jsonDisplayRef.current.copyJson();
        setStickyCopied(true);
        setTimeout(() => setStickyCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-200 overflow-hidden font-sans tracking-wide selection:bg-blue-500/30">
      
      <LeftPanel 
        appState={appState}
        messages={messages}
        isChatting={isChatting}
        inputText={inputText}
        setInputText={setInputText}
        handleInputSubmit={handleInputSubmit}
        selectedFiles={selectedFiles}
        handleFileSelect={handleFileSelect}
        handleRemoveFile={handleRemoveFile}
        handleAnalyzeFiles={handleAnalyzeFiles}
        handleCancelAnalysis={handleCancelAnalysis}
        handleReset={handleReset}
        fileInputRef={fileInputRef}
        chatEndRef={chatEndRef}
      />

      <RightPanel 
        appState={appState}
        analysis={analysis}
        errorDetail={errorDetail}
        onReset={() => {
            handleReset();
            // Add specific error reset message if needed
             setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: 'System reset due to visualization error.',
                timestamp: Date.now()
            }]);
        }}
        jsonDisplayRef={jsonDisplayRef}
        scrollContainerRef={scrollContainerRef}
        showStickyActions={showStickyActions}
        stickyCopied={stickyCopied}
        onCopyJson={handleStickyCopyJson}
        onDownloadReport={() => jsonDisplayRef.current?.downloadReport()}
        headerText={getHeaderText()}
        onScroll={handleScroll}
      />
    </div>
  );
};

export default App;