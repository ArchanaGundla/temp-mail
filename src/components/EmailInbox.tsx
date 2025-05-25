
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inbox, Refresh, Mail, Clock, User, Eye } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: Date;
  read: boolean;
}

interface EmailInboxProps {
  email: string;
  onEmailSelect: (email: Email) => void;
}

const EmailInbox: React.FC<EmailInboxProps> = ({ email, onEmailSelect }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock email data for demonstration
  const mockEmails: Email[] = [
    {
      id: '1',
      from: 'welcome@example.com',
      subject: 'Welcome to our service!',
      preview: 'Thank you for signing up. Please verify your email address...',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
    },
    {
      id: '2',
      from: 'noreply@github.com',
      subject: 'Verify your GitHub account',
      preview: 'Click the link below to verify your GitHub account...',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      read: false
    },
    {
      id: '3',
      from: 'newsletter@techcrunch.com',
      subject: 'Daily Tech Newsletter',
      preview: 'Here are today\'s top tech stories and startup news...',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      read: true
    }
  ];

  const refreshEmails = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setEmails([...mockEmails]);
      setIsRefreshing(false);
    }, 1000);
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

  const handleEmailClick = (emailItem: Email) => {
    const updatedEmails = emails.map(e => 
      e.id === emailItem.id ? { ...e, read: true } : e
    );
    setEmails(updatedEmails);
    onEmailSelect({ ...emailItem, read: true });
  };

  useEffect(() => {
    // Auto-refresh emails every 30 seconds
    const interval = setInterval(refreshEmails, 30000);
    refreshEmails(); // Initial load
    
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
            <Refresh className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {emails.length === 0 ? (
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
