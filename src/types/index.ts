export interface ReceiptImage {
  id: string;
  file: File;
  preview: string;
  isReceipt: boolean | null;
  isSelected: boolean;
  error?: string;
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  toEmail: string;
  subject: string;
}

export interface AppState {
  images: ReceiptImage[];
  isProcessing: boolean;
  emailConfig: EmailConfig;
  currentStep: 'upload' | 'review' | 'email';
}
