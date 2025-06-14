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
        title: "🎉 Email Generated!",
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
          title: "✅ Copied!",
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
            title: "✅ Copied!",
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
    <Card className="w-full max-w-md mx-auto bg-white shadow-xl border-2 border-blue-200 rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <CardTitle className="flex items-center space-x-3">
          <Mail className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">Email Generator</h2>
            <p className="text-blue-100 text-sm">Create secure temporary emails</p>
          </div>
        </CardTitle>
        {backendStatus === false && (
          <div className="bg-red-500/20 border border-red-300 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-2 text-red-100">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Backend server offline. Please start Node.js server on port 3001.</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {!currentEmail ? (
          <div className="text-center space-y-6">
            <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-300">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Mail className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Generate</h3>
                <p className="text-gray-600">Click below to create your secure email</p>
              </div>
            </div>
            
            {/* SUPER PROMINENT GENERATE BUTTON */}
            <Button 
              onClick={generateEmail}
              disabled={isGenerating || backendStatus === false}
              size="lg"
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xl rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-7 w-7 animate-spin" />
                  <span>Generating Email...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Mail className="h-7 w-7" />
                  <span>🚀 Generate New Email</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-lg font-semibold text-gray-800 mb-3 block flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>Your Temporary Email</span>
                </label>
                <div className="flex space-x-3">
                  <Input 
                    value={currentEmail} 
                    readOnly 
                    className="font-mono text-lg bg-gray-50 border-2 border-blue-200 rounded-xl h-12 flex-1"
                  />
                  
                  {/* PROMINENT COPY BUTTON */}
                  <Button 
                    onClick={copyToClipboard}
                    size="lg"
                    className="h-12 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Copy className="h-5 w-5 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              {timeLeft && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-800">Time Remaining</span>
                    </div>
                    <Badge className="bg-blue-600 text-white font-mono text-lg px-3 py-1">
                      {timeLeft}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={generateEmail}
                size="lg"
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                disabled={isGenerating || backendStatus === false}
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'New Email'}
              </Button>
              <Button 
                onClick={deleteEmail}
                size="lg"
                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailGenerator;
