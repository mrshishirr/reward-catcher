import { useState, useCallback, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, CircularProgress, Snackbar, Alert, Typography } from '@mui/material';
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
    if (!files.length) return;

    updateState({
      isProcessing: true,
      currentStep: 'upload' // Ensure we're on the upload step
    });

    const newImages: ReceiptImage[] = [];

    try {
      for (const file of files) {
        const newImage: ReceiptImage = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: URL.createObjectURL(file),
          isReceipt: null,
          isSelected: true,
        };
        newImages.push(newImage);
        processAndDetectReceipt(newImage);
      }

      // Add new images to state
      setState(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));

    } catch (error) {
      console.error('Error processing files:', error);
      setSnackbar({
        open: true,
        message: 'Error processing files',
        severity: 'error'
      });
    } finally {
      updateState({ isProcessing: false });
    }
  };

  const handleStartReview = () => {
    updateState({ currentStep: 'review' });
  };

  const processAndDetectReceipt = async (image: ReceiptImage) => {
    try {
      // Process the image (compress, etc.)
      const { file: processedFile, previewUrl } = await processImageFile(image.file);

      // Detect if it's a receipt
      const { isReceipt: isReceiptResult } = await isReceipt(processedFile);

      // Update state with both the processed file and receipt detection result
      setState(prev => ({
        ...prev,
        images: prev.images.map(img =>
            img.id === image.id
                ? { ...img, file: processedFile, preview: previewUrl, isReceipt: isReceiptResult }
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

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      state.images.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
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
            {state.isProcessing && state.currentStep === 'upload' ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  gap: 2
                }}>
                  <CircularProgress size={60} thickness={4} />
                  <Typography variant="h6" color="textSecondary">
                    Processing images...
                  </Typography>
                </Box>
            ) : (
                <>
                  {state.currentStep === 'upload' && (
                      <UploadStep
                          onFilesSelected={handleFilesSelected}
                          isProcessing={state.isProcessing}
                          onStartReview={handleStartReview}
                          selectedCount={state.images.length}
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
            )}
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
