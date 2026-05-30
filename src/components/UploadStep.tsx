import React, { useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useDropzone } from 'react-dropzone';
import { ReceiptImage } from '../types';

interface UploadStepProps {
    onFilesSelected: (files: File[]) => void;
    isProcessing: boolean;
    onStartReview: () => void;
    images: ReceiptImage[];
}

const UploadStep: React.FC<UploadStepProps> = ({ onFilesSelected, onStartReview, images }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFilesSelected(acceptedFiles);
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        multiple: true,
        noClick: true,
    });

    const pending = images.some(img => img.isReceipt === null);

    return (
        <Box>
            <Box
                {...getRootProps()}
                sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
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
                    Supported formats: JPG, PNG (max 10MB each)
                </Typography>
                <Button variant="outlined" onClick={open} disabled={pending} sx={{ mt: 2 }}>
                    Choose Photos
                </Button>
            </Box>

            {images.length > 0 && (
                <>
                    <List dense>
                        {images.map(img => (
                            <ListItem key={img.id}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    {img.isReceipt === null
                                        ? <CircularProgress size={18} />
                                        : img.isReceipt
                                            ? <CheckCircleIcon color="success" fontSize="small" />
                                            : <ErrorOutlineIcon color="error" fontSize="small" />}
                                </ListItemIcon>
                                <ListItemText
                                    primary={img.file.name}
                                    secondary={img.isReceipt === null ? 'Analyzing...' : img.isReceipt ? 'Receipt' : 'Not a receipt'}
                                />
                            </ListItem>
                        ))}
                    </List>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onStartReview}
                            disabled={pending}
                            startIcon={pending ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                        >
                            {pending ? 'Analyzing...' : `Review ${images.length} ${images.length === 1 ? 'File' : 'Files'}`}
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default UploadStep;
