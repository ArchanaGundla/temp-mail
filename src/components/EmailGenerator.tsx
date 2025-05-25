
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Mail, Clock, Trash2, Refresh } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailGeneratorProps {
  currentEmail: string | null;
  setCurrentEmail: (email: string | null) => void;
  expirationTime: Date | null;
  setExpirationTime: (time: Date | null) => void;
}

const EmailGenerator: React.FC<EmailGeneratorProps> = ({
  currentEmail,
  setCurrentEmail,
  expirationTime,
  setExpirationTime
}) => {
  const [duration, setDuration] = useState('10');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { toast } = useToast();

  const domains = [
    'tempmail.pro',
    'quickmail.temp',
    'instant.email',
    'privacy.mail'
  ];

  const generateRandomEmail = () => {
    const prefixes = ['temp', 'quick', 'anon', 'user', 'mail', 'inbox'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(Math.random() * 9999);
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    
    return `${randomPrefix}${randomNumber}@${randomDomain}`;
  };

  const generateEmail = () => {
    const newEmail = generateRandomEmail();
    const expirationDate = new Date(Date.now() + parseInt(duration) * 60 * 1000);
    
    setCurrentEmail(newEmail);
    setExpirationTime(expirationDate);
    
    toast({
      title: "Email Generated!",
      description: `Your temporary email is ready: ${newEmail}`,
    });
  };

  const copyToClipboard = () => {
    if (currentEmail) {
      navigator.clipboard.writeText(currentEmail);
      toast({
        title: "Copied!",
        description: "Email address copied to clipboard",
      });
    }
  };

  const deleteEmail = () => {
    setCurrentEmail(null);
    setExpirationTime(null);
    toast({
      title: "Email Deleted",
      description: "Temporary email has been removed",
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (expirationTime) {
        const now = new Date();
        const diff = expirationTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setCurrentEmail(null);
          setExpirationTime(null);
          toast({
            title: "Email Expired",
            description: "Your temporary email has automatically expired",
          });
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expirationTime, setCurrentEmail, setExpirationTime, toast]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-gray-800">
          <Mail className="h-5 w-5 text-blue-600" />
          <span>Email Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentEmail ? (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Email Duration
              </label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={generateEmail}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Generate New Email
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Your Temporary Email
                </label>
                <div className="flex space-x-2">
                  <Input 
                    value={currentEmail} 
                    readOnly 
                    className="font-mono text-sm bg-gray-50"
                  />
                  <Button 
                    onClick={copyToClipboard}
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {timeLeft && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Time Left</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-mono">
                    {timeLeft}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={generateEmail}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Refresh className="h-4 w-4 mr-2" />
                New Email
              </Button>
              <Button 
                onClick={deleteEmail}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailGenerator;
