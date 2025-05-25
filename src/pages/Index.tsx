
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Clock, Shield, Trash2, Refresh, Eye } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  TempMail Pro
                </h1>
                <p className="text-sm text-gray-600">Disposable email addresses for privacy</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">Secure & Anonymous</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Email Generator */}
            <div className="lg:col-span-1">
              <EmailGenerator 
                currentEmail={currentEmail}
                setCurrentEmail={setCurrentEmail}
                expirationTime={expirationTime}
                setExpirationTime={setExpirationTime}
              />
            </div>

            {/* Inbox */}
            <div className="lg:col-span-2">
              {currentEmail ? (
                <div className="space-y-6">
                  <EmailInbox 
                    email={currentEmail}
                    onEmailSelect={setSelectedEmail}
                  />
                  
                  {selectedEmail && (
                    <EmailViewer 
                      email={selectedEmail}
                      onClose={() => setSelectedEmail(null)}
                    />
                  )}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Mail className="h-12 w-12 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Generate a temporary email to get started
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      Click "Generate New Email" to create a disposable email address and start receiving messages instantly.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Auto-Expire</h3>
                <p className="text-sm text-gray-600">
                  Emails automatically delete after the specified time period for maximum privacy.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Anonymous</h3>
                <p className="text-sm text-gray-600">
                  No registration required. Your real email address stays completely private.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Refresh className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Instant</h3>
                <p className="text-sm text-gray-600">
                  Generate unlimited temporary emails instantly. Perfect for signups and verification.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
