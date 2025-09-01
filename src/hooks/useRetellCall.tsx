import { useState, useCallback } from 'react';
import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RetellWebClient } from 'retell-client-js-sdk';

export interface RetellCallOptions {
  agentId: string;
  customerName?: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface RetellCallState {
  isInitiating: boolean;
  isCallActive: boolean;
  callId: string | null;
  error: string | null;
}

export const useRetellCall = () => {
  const [state, setState] = useState<RetellCallState>({
    isInitiating: false,
    isCallActive: false,
    callId: null,
    error: null,
  });
  const { toast } = useToast();
  
  // Store the retell client instance for call management
  const retellClientRef = React.useRef<RetellWebClient | null>(null);

  const fallbackFetch = async (cleanPayload: any) => {
    console.log('Using fallback fetch method');
    
    // Get the environment variables directly
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xdinmyztzvrcasvgupir.supabase.co";
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaW5teXp0enZyY2Fzdmd1cGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzgyMjksImV4cCI6MjA2ODI1NDIyOX0.nUYgDJHoZNX5P4ZYKeeY0_AeIV8ZGpCaYjHMyScxwCQ";
    
    const functionUrl = `${SUPABASE_URL}/functions/v1/create-web-call`;
    console.log('Fallback fetch URL:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(cleanPayload),
    });

    console.log('Fallback response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fallback response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Fallback response data:', responseData);
    return responseData;
  };

  const initiateCall = useCallback(async (options: RetellCallOptions) => {
    setState(prev => ({ ...prev, isInitiating: true, error: null }));

    try {
      console.log('Initiating call with options:', options);
      
      // Validate all required parameters
      if (!options.agentId) {
        throw new Error('Agent ID is required');
      }
      
      // Create clean payload with validated data
      const cleanPayload = {
        agent_id: String(options.agentId),
        customer_name: options.customerName ? String(options.customerName) : undefined,
        customer_email: options.customerEmail ? String(options.customerEmail) : undefined,
        metadata: {
          source: 'enterprise_contact',
          timestamp: new Date().toISOString(),
          ...(options.metadata || {})
        }
      };
      
      // Use Supabase client for proper request handling
      console.log('Calling Supabase function with payload:', cleanPayload);
      
      const response = await supabase.functions.invoke('create-web-call', {
        body: cleanPayload,
      });
      
      console.log('Supabase function response:', response);
      
      if (response.error) {
        console.error('Supabase function error details:', response.error);
        
        // If function doesn't exist or network error, fall back to direct fetch
        if (response.error.message?.includes('Failed to send')) {
          console.log('Falling back to direct fetch method...');
          const fallbackData = await fallbackFetch(cleanPayload);
          const responseData = fallbackData;
          
          if (!responseData || typeof responseData !== 'object') {
            throw new Error('Invalid response format');
          }

          const { call_id, access_token } = responseData;
          
          if (!call_id || !access_token) {
            throw new Error(`Missing fields: call_id=${call_id}, access_token=${access_token ? 'present' : 'missing'}`);
          }

          console.log('Fallback call created successfully, initializing client...');
          
          // Continue with Retell client initialization
          const retellWebClient = new RetellWebClient();
          retellClientRef.current = retellWebClient;
          
          retellWebClient.startCall({
            accessToken: access_token,
            callId: call_id,
            sampleRate: 24000,
            enableUpdate: true,
          });

          // Set up event listeners (same as below)
          retellWebClient.on('call_started', () => {
            console.log('Call started event received');
            setState(prev => ({ 
              ...prev, 
              isInitiating: false, 
              isCallActive: true, 
              callId: call_id 
            }));
            toast({
              title: "Call Connected! 📞",
              description: "You're now connected with our sales team.",
              duration: 3000,
            });
          });

          retellWebClient.on('call_ended', () => {
            console.log('Call ended event received');
            setState(prev => ({ 
              ...prev, 
              isCallActive: false, 
              callId: null 
            }));
            retellClientRef.current = null;
            toast({
              title: "Call Ended",
              description: "Thank you for speaking with our sales team. We'll follow up with you soon!",
              duration: 5000,
            });
          });

          retellWebClient.on('error', (error: Error) => {
            console.error('Retell client error:', error);
            setState(prev => ({ 
              ...prev, 
              isInitiating: false, 
              isCallActive: false, 
              error: error.message || 'Call failed',
              callId: null
            }));
            retellClientRef.current = null;
            toast({
              title: "Call Error",
              description: "Unable to connect the call. Please try again or contact us directly.",
              variant: "destructive",
              duration: 7000,
            });
          });
          
          return; // Exit early after successful fallback
        }
        
        throw new Error(`Function error: ${response.error.message || 'Unknown error'}`);
      }
      
      const responseData = response.data;
      
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Invalid response format');
      }

      const { call_id, access_token } = responseData;
      
      if (!call_id || !access_token) {
        throw new Error(`Missing fields: call_id=${call_id}, access_token=${access_token ? 'present' : 'missing'}`);
      }

      console.log('Call created successfully, initializing client...');

      // Initialize the Retell client
      const retellWebClient = new RetellWebClient();
      retellClientRef.current = retellWebClient;
      
      retellWebClient.startCall({
        accessToken: access_token,
        callId: call_id,
        sampleRate: 24000,
        enableUpdate: true,
      });

      // Set up event listeners
      retellWebClient.on('call_started', () => {
        console.log('Call started event received');
        setState(prev => ({ 
          ...prev, 
          isInitiating: false, 
          isCallActive: true, 
          callId: call_id 
        }));
        toast({
          title: "Call Connected! 📞",
          description: "You're now connected with our sales team.",
          duration: 3000,
        });
      });

      retellWebClient.on('call_ended', () => {
        console.log('Call ended event received');
        setState(prev => ({ 
          ...prev, 
          isCallActive: false, 
          callId: null 
        }));
        retellClientRef.current = null;
        toast({
          title: "Call Ended",
          description: "Thank you for speaking with our sales team. We'll follow up with you soon!",
          duration: 5000,
        });
      });

      retellWebClient.on('error', (error: Error) => {
        console.error('Retell client error:', error);
        setState(prev => ({ 
          ...prev, 
          isInitiating: false, 
          isCallActive: false, 
          error: error.message || 'Call failed',
          callId: null
        }));
        retellClientRef.current = null;
        toast({
          title: "Call Error",
          description: "Unable to connect the call. Please try again or contact us directly.",
          variant: "destructive",
          duration: 7000,
        });
      });

    } catch (error: unknown) {
      console.error('Call initiation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate call';
      setState(prev => ({ 
        ...prev, 
        isInitiating: false, 
        error: errorMessage
      }));
      toast({
        title: "Connection Error",
        description: `Unable to initiate the call: ${errorMessage}. Please try again or email us directly.`,
        variant: "destructive",
        duration: 7000,
      });
    }
  }, [toast]);

  const endCall = useCallback(() => {
    try {
      if (retellClientRef.current && state.isCallActive) {
        console.log('Ending call...');
        retellClientRef.current.stopCall();
        
        // Update state immediately to provide user feedback
        setState(prev => ({ 
          ...prev, 
          isCallActive: false, 
          callId: null 
        }));
        
        retellClientRef.current = null;
        
        toast({
          title: "Call Ended",
          description: "Call has been ended successfully.",
          duration: 3000,
        });
      } else {
        console.log('No active call to end');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      toast({
        title: "Error",
        description: "Failed to end the call properly.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [state.isCallActive, toast]);

  return {
    state,
    initiateCall,
    endCall,
  };
};

