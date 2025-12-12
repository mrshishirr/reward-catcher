import { EmailConfig, ReceiptImage } from '../types';
import emailjs from '@emailjs/browser';

export const sendReceiptsByEmail = async (
    images: ReceiptImage[],
    config: EmailConfig
): Promise<{ success: boolean; message: string }> => {
  const { serviceId, templateId, publicKey, toEmail, subject } = config;

  // Filter only selected and verified receipt images
  const receiptsToSend = images.filter(img => img.isSelected && img.isReceipt);

  if (receiptsToSend.length === 0) {
    return { success: false, message: 'No valid receipts selected' };
  }

  try {
    // Send each receipt in a separate email
    for (const receipt of receiptsToSend) {
      const templateParams = {
        to_email: toEmail,
        subject: subject || 'Your Receipt',
        message: 'Please find your receipt attached.',
        attachment: receipt.file,
      };

      await emailjs.send(
          serviceId,
          templateId,
          templateParams,
          publicKey
      );
    }

    return {
      success: true,
      message: `Successfully sent ${receiptsToSend.length} receipt(s) to ${toEmail}`,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Helper function to validate email configuration
export const validateEmailConfig = (config: Partial<EmailConfig>): string | null => {
  if (!config.serviceId) return 'Email service ID is required';
  if (!config.templateId) return 'Email template ID is required';
  if (!config.publicKey) return 'Email public key is required';
  if (!config.toEmail) return 'Recipient email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.toEmail)) {
    return 'Please enter a valid email address';
  }
  return null;
};
