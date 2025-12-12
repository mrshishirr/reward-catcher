import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  Checkbox,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Receipt as ReceiptIcon, CheckCircle, ErrorOutline, InfoOutlined } from '@mui/icons-material';
import { ReceiptImage } from '../types';

interface ReviewStepProps {
  images: ReceiptImage[];
  onSelectionChange: (id: string, isSelected: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ 
  images, 
  onSelectionChange, 
  onNext,
  onBack,
  isProcessing 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Count selected and detected receipts
  const { selectedCount, receiptCount } = useMemo(() => ({
    selectedCount: images.filter(img => img.isSelected).length,
    receiptCount: images.filter(img => img.isReceipt === true).length
  }), [images]);

  const handleImageClick = (id: string) => {
    setSelectedId(selectedId === id ? null : id);
  };

  const handleSelectAll = (select: boolean) => {
    images.forEach(img => onSelectionChange(img.id, select));
  };

  const handleToggleSelect = (id: string, currentValue: boolean) => {
    onSelectionChange(id, !currentValue);
  };

  const getStatusChip = (image: ReceiptImage) => {
    if (image.isReceipt === null) {
      return (
        <Chip 
          icon={<CircularProgress size={16} />} 
          label="Analyzing..." 
          size="small"
          color="default"
        />
      );
    }
    
    if (image.isReceipt) {
      return (
        <Chip 
          icon={<CheckCircle fontSize="small" />} 
          label="Receipt" 
          size="small" 
          color="success"
        />
      );
    }
    
    return (
      <Chip 
        icon={<ErrorOutline fontSize="small" />} 
        label="Not a receipt" 
        size="small" 
        color="error"
      />
    );
  };

  if (images.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No images to review
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, maxWidth: 400, mx: 'auto' }}>
          Go back to the upload step and add some receipt images to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h6" component="div">
            Review Receipts
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedCount} of {images.length} selected • {receiptCount} receipts detected
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            onClick={() => handleSelectAll(false)}
            disabled={selectedCount === 0 || isProcessing}
            size={isMobile ? 'small' : 'medium'}
          >
            Deselect All
          </Button>
          <Button 
            onClick={() => handleSelectAll(true)}
            disabled={selectedCount === images.length || isProcessing}
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
          >
            Select All
          </Button>
          <Button 
            onClick={onNext}
            variant="contained"
            color="primary"
            disabled={selectedCount === 0 || isProcessing}
            size={isMobile ? 'small' : 'medium'}
          >
            Next ({selectedCount})
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {images.map((image) => (
          <Grid item={true} xs={12} sm={6} md={4} key={image.id}>
            <Card 
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderColor: selectedId === image.id ? 'primary.main' : 'divider',
                boxShadow: selectedId === image.id ? theme.shadows[2] : 'none',
                transition: 'all 0.2s ease-in-out',
                opacity: image.isSelected ? 1 : 0.7,
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  borderColor: 'primary.main',
                },
              }}
            >
              <Box 
                onClick={() => handleImageClick(image.id)}
                sx={{ cursor: 'pointer', position: 'relative', pt: '75%' }}
              >
                <CardMedia
                  component="img"
                  image={image.preview}
                  alt="Receipt preview"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Checkbox
                    checked={image.isSelected}
                    onChange={() => handleToggleSelect(image.id, image.isSelected)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    sx={{
                      color: 'white',
                      '&.Mui-checked': {
                        color: 'white',
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: 20,
                      },
                      p: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  />
                </Box>
                
                {image.error && (
                  <Tooltip title={image.error} arrow>
                    <InfoOutlined 
                      color="error" 
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '50%',
                        p: 0.5
                      }} 
                    />
                  </Tooltip>
                )}
              </Box>
              
              <Box sx={{ p: 1.5, pt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                    {image.file.name.length > 20 
                      ? `${image.file.name.substring(0, 15)}...${image.file.name.split('.').pop()}`
                      : image.file.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {(image.file.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                  {getStatusChip(image)}
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          onClick={onBack}
          variant="outlined"
          size="large"
          disabled={isProcessing}
          sx={{ minWidth: 120 }}
        >
          Back
        </Button>
        <Button 
          onClick={onNext}
          variant="contained"
          color="primary"
          disabled={selectedCount === 0 || isProcessing}
          size="large"
          sx={{ minWidth: 150 }}
        >
          {isProcessing ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            `Continue (${selectedCount})`
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewStep;
