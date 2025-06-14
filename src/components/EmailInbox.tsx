import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inbox, RefreshCw, Mail, Clock, User, Eye, AlertCircle } from 'lucide-react';
import { emailService, EmailMessage } from '@/services/emailService';
import { useToast } from '@/hooks/use-toast';

interface EmailInboxProps {
  email: string;
  onEmailSelect: (email: EmailMessage) => void;
}

const EmailInbox: React.FC<EmailInboxProps> = ({ email, onEmailSelect }) => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshEmails = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      const messages = await emailService.getEmails(email);
      setEmails(messages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch emails';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleEmailClick = (emailItem: EmailMessage) => {
    const updatedEmails = emails.map(e => 
      e.id === emailItem.id ? { ...e, read: true } : e
    );
    setEmails(updatedEmails);
    onEmailSelect({ ...emailItem, read: true });
  };

  useEffect(() => {
    // Initial load
    refreshEmails();
    
    // Auto-refresh emails every 15 seconds
    const interval = setInterval(refreshEmails, 15000);
    return () => clearInterval(interval);
  }, [email]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Inbox className="h-5 w-5 text-blue-600" />
            <span>Inbox</span>
            {emails.filter(e => !e.read).length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 ml-2">
                {emails.filter(e => !e.read).length} new
              </Badge>
            )}
          </CardTitle>
          <Button 
            onClick={refreshEmails}
            size="sm"
            variant="outline"
            disabled={isRefreshing}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          Receiving emails at: <span className="font-mono font-medium">{email}</span>
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {emails.length === 0 && !isRefreshing ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Mail className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No emails yet</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Your temporary inbox is empty. Emails will appear here as they arrive.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {emails.map((emailItem) => (
                <div
                  key={emailItem.id}
                  onClick={() => handleEmailClick(emailItem)}
                  className={`p-4 hover:bg-blue-50 cursor-pointer transition-colors ${
                    !emailItem.read ? 'bg-blue-25 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <User className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {emailItem.from}
                      </span>
                      {!emailItem.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(emailItem.timestamp)}</span>
                    </div>
                  </div>
                  <h4 className={`text-sm mb-1 ${!emailItem.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {emailItem.subject}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {emailItem.preview}
                  </p>
                  <div className="flex justify-end mt-2">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EmailInbox;
