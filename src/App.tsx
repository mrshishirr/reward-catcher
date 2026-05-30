import { useState, useCallback, useEffect, useRef } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, Snackbar, Alert } from '@mui/material';
import AppBar from './components/AppBar';
import UploadStep from './components/UploadStep';
import ReviewStep from './components/ReviewStep';
import EmailStep from './components/EmailStep';
import { AppState, EmailConfig, ReceiptImage } from './types';
import { processImageFile } from './utils/imageUtils';
import { isReceipt } from './services/receiptDetection';
import { sendReceiptsByEmail } from './services/emailService';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
  },
});

const defaultEmailConfig: EmailConfig = {
  serviceId: '',
  templateId: '',
  publicKey: '',
  toEmail: '',
  subject: 'Receipts from Receipt Scanner',
};

const loadConfig = (): EmailConfig | null => {
  const savedConfig = localStorage.getItem('emailConfig');
  return savedConfig ? JSON.parse(savedConfig) : null;
};

const saveConfig = (config: EmailConfig) => {
  localStorage.setItem('emailConfig', JSON.stringify(config));
};

function App() {
  const [state, setState] = useState<AppState>(() => {
    const savedConfig = loadConfig();
    return {
      images: [],
      isProcessing: false,
      emailConfig: savedConfig || { ...defaultEmailConfig },
      currentStep: 'upload',
    };
  });

  // Log page lifecycle events to detect iOS Safari reloads
  useEffect(() => {
    const onVisibilityChange = () => console.log('[App] visibilitychange:', document.visibilityState, 'images:', state.images.length);
    const onPageHide = (e: PageTransitionEvent) => console.log('[App] pagehide persisted:', e.persisted, 'images:', state.images.length);
    const onFocus = () => console.log('[App] window focus, images:', state.images.length);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('focus', onFocus);
    };
  }, [state.images.length]);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      emailConfig: { ...prev.emailConfig, ...updates.emailConfig },
    }));
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    if (!files.length) { console.log('[App] handleFilesSelected: empty, ignoring'); return; }
    console.log('[App] handleFilesSelected:', files.length, 'files');

    const newImages: ReceiptImage[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      isReceipt: null,
      isSelected: true,
    }));

    setState(prev => { console.log('[App] setState images:', prev.images.length, '+', newImages.length); return { ...prev, images: [...prev.images, ...newImages] }; });
    // Process serially — parallel WASM instances exhaust iOS Safari memory
    (async () => { for (const img of newImages) await processAndDetectReceipt(img); })();
  };

  const handleStartReview = () => {
    updateState({ currentStep: 'review' });
  };

  const processAndDetectReceipt = async (image: ReceiptImage) => {
    console.log('[App] processAndDetectReceipt start:', image.file.name);
    try {
      const { file: processedFile } = await processImageFile(image.file);
      const previewUrl = URL.createObjectURL(image.file);
      const { isReceipt: isReceiptResult } = await isReceipt(image.file);
      console.log('[App] processAndDetectReceipt done:', image.file.name, isReceiptResult);
      setState(prev => ({
        ...prev,
        images: prev.images.map(img =>
            img.id === image.id
                ? { ...img, file: processedFile, preview: previewUrl, isReceipt: isReceiptResult, isSelected: isReceiptResult }
                : img
        ),
      }));

    } catch (error) {
      console.error('Error processing image:', error);
      setState(prev => ({
        ...prev,
        images: prev.images.map(img =>
            img.id === image.id
                ? { ...img, error: 'Error processing image' }
                : img
        ),
      }));
    }
  };

  const handleSelectionChange = (id: string, isSelected: boolean) => {
    setState(prev => ({
      ...prev,  // Spread all existing state
      images: prev.images.map(img =>
          img.id === id ? { ...img, isSelected } : img
      ),
    }));
  };

  const handleEmailConfigChange = (updates: Partial<EmailConfig>) => {
    const newConfig = { ...state.emailConfig, ...updates };
    saveConfig(newConfig);
    updateState({ emailConfig: newConfig });
  };

  const handleSendEmails = async () => {
    if (state.isProcessing) return;

    try {
      updateState({ isProcessing: true });
      const selectedImages = state.images.filter(img => img.isSelected && img.isReceipt);

      if (selectedImages.length === 0) {
        showSnackbar('No valid receipts selected', 'error');
        return;
      }

      // Save the current config before sending
      saveConfig(state.emailConfig);

      const result = await sendReceiptsByEmail(selectedImages, state.emailConfig);

      if (result.success) {
        showSnackbar(result.message);
        updateState({ currentStep: 'upload', images: [] }); // Reset after successful send
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      showSnackbar('Failed to send emails', 'error');
    } finally {
      updateState({ isProcessing: false });
    }
  };

  const handleNext = () => {
    if (state.currentStep === 'upload') {
      updateState({ currentStep: 'review' });
    } else if (state.currentStep === 'review') {
      updateState({ currentStep: 'email' });
    }
  };

  const handleBack = () => {
    if (state.currentStep === 'review') {
      updateState({ currentStep: 'upload' });
    } else if (state.currentStep === 'email') {
      updateState({ currentStep: 'review' });
    }
  };

  // Clean up object URLs only when images are removed/reset
  const prevImagesRef = useRef<ReceiptImage[]>([]);
  useEffect(() => {
    const prev = prevImagesRef.current;
    const current = state.images;
    // Revoke URLs for images that are no longer in state
    prev.forEach(img => {
      if (!current.find(i => i.id === img.id)) URL.revokeObjectURL(img.preview);
    });
    prevImagesRef.current = current;
  }, [state.images]);

  const selectedCount = state.images.filter(img => img.isSelected).length;
  const receiptCount = state.images.filter(img => img.isReceipt === true).length;

  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar currentStep={state.currentStep} />

          <Container
              component="main"
              sx={{
                mt: 4,
                mb: 4,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
          >
            <>
                  {state.currentStep === 'upload' && (
                      <UploadStep
                          onFilesSelected={handleFilesSelected}
                          isProcessing={state.isProcessing}
                          onStartReview={handleStartReview}
                          images={state.images}
                      />
                  )}

                  {state.currentStep === 'review' && (
                      <ReviewStep
                          images={state.images}
                          onSelectionChange={handleSelectionChange}
                          onNext={handleNext}
                          onBack={handleBack}
                          isProcessing={state.isProcessing}
                      />
                  )}

                  {state.currentStep === 'email' && (
                      <EmailStep
                          config={state.emailConfig}
                          onConfigChange={handleEmailConfigChange}
                          onSend={handleSendEmails}
                          onBack={handleBack}
                          isProcessing={state.isProcessing}
                          receiptCount={receiptCount}
                          selectedCount={selectedCount}
                      />
                  )}
                </>
          </Container>
        </Box>

        <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
  );
}

export default App;
