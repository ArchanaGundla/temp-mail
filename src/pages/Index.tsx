
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Clock, Shield, Trash2, RefreshCw, Eye, Sparkles, Zap, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EmailGenerator from '@/components/EmailGenerator';
import EmailInbox from '@/components/EmailInbox';
import EmailViewer from '@/components/EmailViewer';

const Index = () => {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [expirationTime, setExpirationTime] = useState<Date | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-xl shadow-lg">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  TempMail Pro
                </h1>
                <p className="text-sm text-gray-600 flex items-center space-x-1">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Secure disposable emails for ultimate privacy</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Secure & Anonymous</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Email Generator */}
            <div className="lg:col-span-1">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <EmailGenerator 
                  currentEmail={currentEmail}
                  setCurrentEmail={setCurrentEmail}
                  expirationTime={expirationTime}
                  setExpirationTime={setExpirationTime}
                />
              </div>
            </div>

            {/* Inbox */}
            <div className="lg:col-span-2">
              {currentEmail ? (
                <div className="space-y-6">
                  <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <EmailInbox 
                      email={currentEmail}
                      onEmailSelect={setSelectedEmail}
                    />
                  </div>
                  
                  {selectedEmail && (
                    <div className="animate-fade-in">
                      <EmailViewer 
                        email={selectedEmail}
                        onClose={() => setSelectedEmail(null)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="flex flex-col items-center justify-center h-80 text-center p-8">
                    <div className="relative mb-6">
                      <div className="p-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full shadow-lg">
                        <Mail className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 p-2 bg-yellow-400 rounded-full shadow-md animate-bounce">
                        <Sparkles className="h-5 w-5 text-yellow-800" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      Generate Your First Email
                    </h3>
                    <p className="text-gray-600 max-w-md leading-relaxed">
                      Click "Generate New Email" to create a secure, disposable email address and start receiving messages instantly. Your privacy is our priority!
                    </p>
                    <div className="mt-6 flex items-center space-x-2 text-sm text-purple-600">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Instant • Secure • Anonymous</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Enhanced Features Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                Why Choose TempMail Pro?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Experience the ultimate in email privacy with our advanced temporary email service
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white/70 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Auto-Expire</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Emails automatically delete after the specified time period for maximum privacy and security.
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-1 text-blue-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Smart Cleanup</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-teal-100 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">100% Anonymous</h3>
                  <p className="text-gray-600 leading-relaxed">
                    No registration required. Your real email address stays completely private and protected.
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-1 text-teal-600">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Zero Tracking</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-purple-100 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Lightning Fast</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Generate unlimited temporary emails instantly. Perfect for signups, verification, and testing.
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-1 text-purple-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Unlimited Use</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
