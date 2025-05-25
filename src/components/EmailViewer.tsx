
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, User, Clock, Reply, Forward, Trash2 } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: Date;
  read: boolean;
}

interface EmailViewerProps {
  email: Email;
  onClose: () => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({ email, onClose }) => {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mock full email content
  const fullContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #2563eb;">Welcome to our service!</h2>
      <p>Thank you for signing up for our service. We're excited to have you on board!</p>
      
      <p>To get started, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      
      <p>If you didn't create this account, you can safely ignore this email.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <p style="font-size: 12px; color: #6b7280;">
        This email was sent to ${email.from}. If you no longer wish to receive these emails, you can unsubscribe at any time.
      </p>
    </div>
  `;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader className="pb-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {email.subject}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>From: {email.from}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{formatDateTime(email.timestamp)}</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="shrink-0 ml-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: fullContent }}
        />
        
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-gray-200">
          <Button size="sm" variant="outline" disabled>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button size="sm" variant="outline" disabled>
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </Button>
          <Button size="sm" variant="outline" disabled>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Badge variant="secondary" className="ml-auto">
            Temporary Email - No replies possible
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailViewer;
