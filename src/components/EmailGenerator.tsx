
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Mail, Clock, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { emailService } from '@/services/emailService';

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
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check backend health on component mount
  useEffect(() => {
    const checkBackend = async () => {
      const isHealthy = await emailService.checkHealth();
      setBackendStatus(isHealthy);
      if (!isHealthy) {
        toast({
          title: "Backend Offline",
          description: "Please start the Node.js backend server on port 3001",
          variant: "destructive"
        });
      }
    };
    checkBackend();
  }, [toast]);

  const generateEmail = async () => {
    if (!backendStatus) {
      toast({
        title: "Backend Offline",
        description: "Please start the Node.js backend server first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await emailService.createTempEmail();
      setCurrentEmail(response.email);
      setExpirationTime(response.expirationTime);
      
      toast({
        title: "Email Generated!",
        description: `Your temporary email is ready: ${response.email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate email",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (currentEmail) {
      try {
        await navigator.clipboard.writeText(currentEmail);
        toast({
          title: "Copied!",
          description: "Email address copied to clipboard",
        });
      } catch (error) {
        // Fallback for older browsers or when clipboard API fails
        const textArea = document.createElement('textarea');
        textArea.value = currentEmail;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: "Copied!",
            description: "Email address copied to clipboard",
          });
        } catch (fallbackError) {
          toast({
            title: "Copy Failed",
            description: "Unable to copy to clipboard",
            variant: "destructive"
          });
        }
        document.body.removeChild(textArea);
      }
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
        <CardTitle className="flex items-center justify-between text-gray-800">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <span>Email Generator</span>
          </div>
          {backendStatus === false && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
        {backendStatus === false && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            Backend server is offline. Please start the Node.js server on port 3001.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentEmail ? (
          <Button 
            onClick={generateEmail}
            disabled={isGenerating || backendStatus === false}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate New Email'}
          </Button>
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
                disabled={isGenerating || backendStatus === false}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'New Email'}
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
