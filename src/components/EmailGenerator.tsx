
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
    <Card className="bg-white/95 backdrop-blur-lg border-2 border-blue-200 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden relative">
      {/* Enhanced gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-lg p-[2px]">
        <div className="bg-white/98 backdrop-blur-lg rounded-lg h-full w-full">
          <CardHeader className="pb-4 relative bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center justify-between text-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Email Generator
                  </span>
                  <p className="text-sm text-gray-600 font-normal">Create secure temporary emails</p>
                </div>
              </div>
              {backendStatus === false && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </CardTitle>
            {backendStatus === false && (
              <div className="text-sm text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm mt-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Backend server is offline. Please start the Node.js server on port 3001.</span>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6 p-6">
            {!currentEmail ? (
              <div className="text-center space-y-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 rounded-2xl border-2 border-dashed border-blue-200">
                  <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="text-lg font-medium">Ready to generate your secure email</span>
                  </div>
                  <p className="text-gray-500 text-sm">Click the button below to create a temporary email address</p>
                </div>
                
                {/* Enhanced Generate Button - More Prominent */}
                <Button 
                  onClick={generateEmail}
                  disabled={isGenerating || backendStatus === false}
                  size="lg"
                  className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 hover:from-blue-700 hover:via-purple-700 hover:to-teal-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-0"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-3">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span>Generating Email...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-6 w-6" />
                      <span>🚀 Generate New Email</span>
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-lg font-bold text-gray-800 mb-3 block flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <span>Your Temporary Email Address</span>
                    </label>
                    <div className="flex space-x-3">
                      <div className="relative flex-1">
                        <Input 
                          value={currentEmail} 
                          readOnly 
                          className="font-mono text-base bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 focus:border-purple-300 rounded-xl pr-12 h-12 text-gray-800 shadow-sm"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                        </div>
                      </div>
                      
                      {/* Enhanced Copy Button - More Prominent */}
                      <Button 
                        onClick={copyToClipboard}
                        size="lg"
                        className="h-12 px-6 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-200 border-0"
                      >
                        <Copy className="h-5 w-5 mr-2" />
                        <span className="text-base">Copy</span>
                      </Button>
                    </div>
                  </div>

                  {timeLeft && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-teal-50 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg shadow-sm">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-800">Time Remaining</span>
                            <p className="text-xs text-gray-600">Auto-expire protection active</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-mono text-lg px-3 py-1 shadow-md">
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
                    className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
                    disabled={isGenerating || backendStatus === false}
                  >
                    <RefreshCw className={`h-5 w-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : 'New Email'}
                  </Button>
                  <Button 
                    onClick={deleteEmail}
                    size="lg"
                    className="h-12 px-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default EmailGenerator;
