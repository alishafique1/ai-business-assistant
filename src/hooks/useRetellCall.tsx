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
      const response = await supabase.functions.invoke('create-web-call', {
        body: cleanPayload,
      });
      
      if (response.error) {
        console.error('Supabase function error:', response.error);
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

