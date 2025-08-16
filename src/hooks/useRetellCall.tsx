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

  const initiateCall = useCallback(async (options: RetellCallOptions) => {
    setState(prev => ({ ...prev, isInitiating: true, error: null }));

    try {
      console.log('Initiating call with options:', options);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
      
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-web-call`;
      console.log('Making request to:', functionUrl);
      
      // Call our Supabase function directly using fetch as a workaround
      const response = await fetch(functionUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: options.agentId,
          customer_name: options.customerName,
          customer_email: options.customerEmail,
          metadata: {
            source: 'enterprise_contact',
            timestamp: new Date().toISOString(),
            ...options.metadata,
          },
        }),
      });

      console.log('Function response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Function response error:', errorText);
        throw new Error(`Function call failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Function response data:', data);

      const { call_id, access_token } = data;

      // Initialize the call
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
        setState(prev => ({ 
          ...prev, 
          isCallActive: false, 
          callId: null 
        }));
        retellClientRef.current = null; // Clear the client reference
        toast({
          title: "Call Ended",
          description: "Thank you for speaking with our sales team. We'll follow up with you soon!",
          duration: 5000,
        });
      });

      retellWebClient.on('error', (error: Error) => {
        setState(prev => ({ 
          ...prev, 
          isInitiating: false, 
          isCallActive: false, 
          error: error.message || 'Call failed',
          callId: null
        }));
        retellClientRef.current = null; // Clear the client reference on error
        toast({
          title: "Call Error",
          description: "Unable to connect the call. Please try again or contact us directly.",
          variant: "destructive",
          duration: 7000,
        });
      });

      // Store the client instance for later use (optional)
      // window.retellWebClient = retellWebClient;

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

