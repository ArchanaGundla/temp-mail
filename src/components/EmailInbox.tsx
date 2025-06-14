
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inbox, RefreshCw, Mail, Clock, User, Eye } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: Date;
  read: boolean;
  body?: string;
}

interface EmailInboxProps {
  email: string;
  onEmailSelect: (email: Email) => void;
}

const EmailInbox: React.FC<EmailInboxProps> = ({ email, onEmailSelect }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate more realistic mock emails based on the current email address
  const generateMockEmails = (currentEmail: string) => {
    const mockEmails: Email[] = [
      {
        id: '1',
        from: 'welcome@github.com',
        subject: 'Welcome to GitHub!',
        preview: 'Thanks for joining GitHub! Let\'s get you started.',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        read: false,
        body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #24292e;">Welcome to GitHub!</h2>
          <p>Hi there,</p>
          <p>Thanks for joining GitHub! We're excited to have you.</p>
          <p>Your account is now ready. Here are some things you can do:</p>
          <ul>
            <li>Create your first repository</li>
            <li>Explore open source projects</li>
            <li>Connect with other developers</li>
          </ul>
          <p>Happy coding!</p>
          <p>The GitHub Team</p>
        </div>`
      },
      {
        id: '2',
        from: 'noreply@google.com',
        subject: 'Verify your Google Account',
        preview: 'Please verify your email address to complete setup.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #1a73e8;">Verify your Google Account</h2>
          <p>Hi,</p>
          <p>You recently created a Google Account. To complete your setup, please verify your email address.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create this account, you can ignore this email.</p>
        </div>`
      },
      {
        id: '3',
        from: 'notifications@linkedin.com',
        subject: 'Someone viewed your profile',
        preview: 'A professional in your network checked out your profile.',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        read: true,
        body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0a66c2;">Profile View Notification</h2>
          <p>Hi,</p>
          <p>Someone in your professional network viewed your LinkedIn profile.</p>
          <p>Keep your profile updated to make a great impression!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #0a66c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Your Profile
            </a>
          </div>
          <p>Best regards,<br>The LinkedIn Team</p>
        </div>`
      }
    ];

    // Add some randomness to simulate new emails
    if (Math.random() > 0.7) {
      const additionalEmails = [
        {
          id: '4',
          from: 'team@discord.com',
          subject: 'Your Discord server is ready!',
          preview: 'Start building your community on Discord.',
          timestamp: new Date(Date.now() - 1 * 60 * 1000),
          read: false,
          body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #5865f2;">Welcome to Discord!</h2>
            <p>Your server is now ready! Invite your friends and start chatting.</p>
          </div>`
        },
        {
          id: '5',
          from: 'hello@figma.com',
          subject: 'Welcome to Figma',
          preview: 'Get started with collaborative design.',
          timestamp: new Date(),
          read: false,
          body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #f24e1e;">Welcome to Figma!</h2>
            <p>Start designing and collaborating with your team.</p>
          </div>`
        }
      ];
      return [...mockEmails, ...additionalEmails.slice(0, Math.floor(Math.random() * 2) + 1)];
    }

    return mockEmails;
  };

  const refreshEmails = () => {
    setIsRefreshing(true);
    // Simulate API call delay
    setTimeout(() => {
      setEmails(generateMockEmails(email));
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
    // Auto-refresh emails every 15 seconds
    const interval = setInterval(refreshEmails, 15000);
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
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          Receiving emails at: <span className="font-mono font-medium">{email}</span>
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
