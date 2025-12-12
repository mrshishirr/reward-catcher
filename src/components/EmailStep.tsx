import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  Grid,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { EmailConfig } from '../types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface EmailStepProps {
  config: EmailConfig;
  onConfigChange: (updates: Partial<EmailConfig>) => void;
  onSend: () => void;
  onBack: () => void;
  isProcessing: boolean;
  selectedCount: number;
  receiptCount: number;
}

const EmailStep: React.FC<EmailStepProps> = ({
  config,
  onConfigChange,
  onSend,
  onBack,
  isProcessing,
  selectedCount,
  receiptCount,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showHelp, setShowHelp] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field: keyof EmailConfig) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onConfigChange({ [field]: event.target.value });
  };

  const canSend = selectedCount > 0 && config.toEmail && config.serviceId && config.templateId && config.publicKey;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} disabled={isProcessing} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" component="div">
          Send Receipts
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip 
          title={
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                How to set up EmailJS
              </Typography>
              <ol style={{ margin: 0, paddingLeft: 16 }}>
                <li>Create a free account at <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>EmailJS.com</a></li>
                <li>Add an email service (Gmail, Outlook, etc.)</li>
                <li>Create an email template</li>
                <li>Copy your Service ID, Template ID, and Public Key</li>
              </ol>
            </Box>
          } 
          arrow
          placement="left"
          onOpen={() => setShowHelp(true)}
          onClose={() => setShowHelp(false)}
          open={showHelp}
        >
          <IconButton>
            <InfoOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item={true} xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlineIcon color="primary" sx={{ mr: 1 }} />
              Ready to send {selectedCount} of {receiptCount} receipt{receiptCount !== 1 ? 's' : ''}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Recipient Email"
                value={config.toEmail}
                onChange={handleInputChange('toEmail')}
                margin="normal"
                type="email"
                variant="outlined"
                disabled={isProcessing}
                required
              />
              
              <TextField
                fullWidth
                label="Email Subject"
                value={config.subject}
                onChange={handleInputChange('subject')}
                margin="normal"
                variant="outlined"
                disabled={isProcessing}
              />
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={() => setShowAdvanced(!showAdvanced)} 
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  {showAdvanced ? 'Hide advanced' : 'Show advanced'}
                </Button>
              </Box>
              
              {showAdvanced && (
                <Box sx={{ mt: 2, animation: 'fadeIn 0.3s ease-in-out' }}>
                  <TextField
                    fullWidth
                    label="EmailJS Service ID"
                    value={config.serviceId}
                    onChange={handleInputChange('serviceId')}
                    margin="normal"
                    variant="outlined"
                    disabled={isProcessing}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="EmailJS Template ID"
                    value={config.templateId}
                    onChange={handleInputChange('templateId')}
                    margin="normal"
                    variant="outlined"
                    disabled={isProcessing}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="EmailJS Public Key"
                    value={config.publicKey}
                    onChange={handleInputChange('publicKey')}
                    margin="normal"
                    variant="outlined"
                    type="password"
                    disabled={isProcessing}
                    required
                  />
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={onBack}
                disabled={isProcessing}
                fullWidth={isMobile}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={onSend}
                disabled={!canSend || isProcessing}
                fullWidth={isMobile}
                sx={{ minWidth: 150 }}
              >
                {isProcessing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `Send ${selectedCount} Receipt${selectedCount !== 1 ? 's' : ''}`
                )}
              </Button>
            </Box>
          </Paper>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Your data is secure</AlertTitle>
            <Typography variant="body2">
              All processing happens in your browser. Your email credentials are never sent to our servers.
            </Typography>
          </Alert>
        </Grid>

        <Grid item xs={12} md={5} container={false}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              border: `1px solid ${theme.palette.divider}`, 
              borderRadius: 2,
              position: 'sticky',
              top: 20,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Sending {selectedCount} Receipt{selectedCount !== 1 ? 's' : ''}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Recipient:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {config.toEmail || 'No email provided'}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                Subject:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {config.subject || 'No subject'}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                Email Service:
              </Typography>
              <Typography variant="body1">
                {config.serviceId ? 'Configured' : 'Not configured'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                How it works:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>
                  <Typography variant="body2">
                    Each receipt will be sent as a separate email
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Images are compressed before sending
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    You'll receive a confirmation when complete
                  </Typography>
                </li>
              </ul>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailStep;
