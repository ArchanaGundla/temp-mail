
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, User, Clock, Reply, Forward, Trash2, Download } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: Date;
  read: boolean;
  body?: string;
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

  const handleDownload = () => {
    const emailContent = `
From: ${email.from}
Subject: ${email.subject}
Date: ${formatDateTime(email.timestamp)}

${email.body ? email.body.replace(/<[^>]*>/g, '') : email.preview}
    `.trim();

    const blob = new Blob([emailContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-${email.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          className="prose prose-sm max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: email.body || `<p>${email.preview}</p>` }}
        />
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" disabled>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
            <Button size="sm" variant="outline" disabled>
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm" variant="outline" disabled>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          <Badge variant="secondary">
            Temporary Email - No replies possible
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailViewer;
