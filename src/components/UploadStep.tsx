import React, { useCallback } from 'react';
import { Box, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useDropzone } from 'react-dropzone';

interface UploadStepProps {
    onFilesSelected: (files: File[]) => void;
    isProcessing: boolean;
    onStartReview: () => void;  // Add this line
    selectedCount: number;      // Add this line
}

const UploadStep: React.FC<UploadStepProps> = ({
                                                   onFilesSelected,
                                                   isProcessing,
                                                   onStartReview,
                                                   selectedCount
                                               }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFilesSelected(acceptedFiles);
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png']
        },
        multiple: true
    });

    return (
        <Box>
            <Box
                {...getRootProps()}
                sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                    mb: 2,
                }}
            >
                <input {...getInputProps()} />
                <CloudUploadIcon fontSize="large" color="action" />
                <Typography variant="h6" gutterBottom>
                    Drag and drop files here, or click to select
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Supported formats: JPG, PNG, PDF (max 10MB each)
                </Typography>
            </Box>

            {selectedCount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onStartReview}
                        disabled={isProcessing}
                        startIcon={<ArrowForwardIcon />}
                    >
                        Review {selectedCount} {selectedCount === 1 ? 'File' : 'Files'}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default UploadStep;
