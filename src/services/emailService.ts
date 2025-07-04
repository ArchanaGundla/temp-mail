import cors from '../../lib/cors-middleware';

const API_BASE_URL = 'https://temp-mail-server.vercel.app/api';
console.log('▶️ Hard‑coded API_BASE_URL:', API_BASE_URL);
console.log('🧪 Env var VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

export interface TempEmailResponse {
  email: string;
  expiresIn: string;
  expirationTime: Date;
}

export interface EmailsResponse {
  messages: EmailMessage[];
}

export const emailService = {
  async createTempEmail(): Promise<TempEmailResponse> {
    const response = await fetch(`${API_BASE_URL}/create-temp-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create temporary email');
    }

    const data = await response.json();
    return {
      ...data,
      expirationTime: new Date(data.expirationTime)
    };
  },

  async getEmails(emailAddress: string): Promise<EmailMessage[]> {
    const response = await fetch(`${API_BASE_URL}/emails/${encodeURIComponent(emailAddress)}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Email expired or does not exist');
      }
      throw new Error('Failed to fetch emails');
    }

    const data: EmailsResponse = await response.json();
    return data.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  },

 async checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
};
