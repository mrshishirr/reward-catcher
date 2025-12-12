import React from 'react';
import { AppBar as MuiAppBar, Toolbar, Typography, Box, LinearProgress } from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { AppState } from '../types';

type Step = AppState['currentStep'];

interface StepInfo {
  label: string;
  value: Step;
}

const STEPS: StepInfo[] = [
  { label: 'Upload', value: 'upload' },
  { label: 'Review', value: 'review' },
  { label: 'Send', value: 'email' },
];

interface AppBarProps {
  currentStep: Step;
}

const AppBar: React.FC<AppBarProps> = ({ currentStep }) => {
  const activeStep = STEPS.findIndex(step => step.value === currentStep);

  return (
    <MuiAppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <ReceiptIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Receipt Scanner
        </Typography>
      </Toolbar>
      
      <Box sx={{ width: '100%', position: 'relative' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          px: { xs: 2, sm: 4 },
          pb: 1,
          position: 'relative',
          zIndex: 1
        }}>
          {STEPS.map((step, index) => (
            <Box 
              key={step.value}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                maxWidth: '120px',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: index <= activeStep ? 'primary.main' : 'action.disabledBackground',
                  color: index <= activeStep ? 'primary.contrastText' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'medium',
                  mb: 0.5,
                }}
              >
                {index + 1}
              </Box>
              <Typography 
                variant="caption" 
                align="center"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: index === activeStep ? 'bold' : 'normal',
                  color: index <= activeStep ? 'text.primary' : 'text.secondary',
                }}
              >
                {step.label}
              </Typography>
            </Box>
          ))}
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={(activeStep / (STEPS.length - 1)) * 100} 
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            '& .MuiLinearProgress-bar': {
              transition: 'transform 0.3s ease-in-out',
            },
          }}
        />
      </Box>
    </MuiAppBar>
  );
};

export default AppBar;
