import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Search, Edit3, Trash2, Link2, Building, Users, Package, Target, Bot, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface KnowledgeEntry {
  id?: string;
  business_name: string;
  industry: string;
  target_audience: string;
  products_services: string;
  created_at?: string;
  updated_at?: string;
}

// Industry options that match the onboarding form
const INDUSTRY_OPTIONS = [
  { value: "consulting", label: "Consulting" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Professional Services" },
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" }
];

// Target audience options for easier selection
const TARGET_AUDIENCE_OPTIONS = [
  { value: "small-businesses", label: "Small Businesses" },
  { value: "enterprise-clients", label: "Enterprise Clients" },
  { value: "startups", label: "Startups" },
  { value: "students", label: "Students" },
  { value: "professionals", label: "Working Professionals" },
  { value: "entrepreneurs", label: "Entrepreneurs" },
  { value: "freelancers", label: "Freelancers" },
  { value: "consumers", label: "General Consumers" },
  { value: "healthcare-providers", label: "Healthcare Providers" },
  { value: "retail-customers", label: "Retail Customers" },
  { value: "tech-companies", label: "Technology Companies" },
  { value: "nonprofits", label: "Non-profit Organizations" },
  { value: "government", label: "Government Agencies" },
  { value: "custom", label: "Custom (Enter manually)" }
];

// Helper function to get industry label from value
const getIndustryLabel = (value: string): string => {
  const option = INDUSTRY_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get industry value from label (for migration)
const getIndustryValue = (label: string): string => {
  const option = INDUSTRY_OPTIONS.find(opt => opt.label.toLowerCase() === label.toLowerCase());
  return option ? option.value : label.toLowerCase();
};

// Helper function to get target audience label from value
const getTargetAudienceLabel = (value: string): string => {
  const option = TARGET_AUDIENCE_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get target audience value from label
const getTargetAudienceValue = (label: string): string => {
  const option = TARGET_AUDIENCE_OPTIONS.find(opt => opt.label.toLowerCase() === label.toLowerCase());
  return option ? option.value : label.toLowerCase();
};

export function KnowledgeBase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<KnowledgeEntry[]>(() => {
    // Load from localStorage on initialization with comprehensive debugging
    try {
      console.log('🔍 INITIALIZING KNOWLEDGE BASE - Checking localStorage');
      const stored = localStorage.getItem('knowledgeBase_entries');
      console.log('📦 localStorage raw data:', stored);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('✅ Parsed localStorage entries:', parsed.length, 'entries found');
        console.log('📋 Entry details:', parsed.map(e => ({ id: e.id, business_name: e.business_name })));
        return parsed;
      } else {
        console.log('⚠️ No localStorage data found, starting with empty array');
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error);
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    target_audience: '',
    products_services: ''
  });
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [activeTab, setActiveTab] = useState<string>("browse");
  const [originalFormData, setOriginalFormData] = useState({
    business_name: '',
    industry: '',
    target_audience: '',
    products_services: ''
  });
  const [selectedTargetAudience, setSelectedTargetAudience] = useState<string>("");
  const [isCustomTargetAudience, setIsCustomTargetAudience] = useState<boolean>(false);
  const [knowledgeBasePreview, setKnowledgeBasePreview] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Semaphore for localStorage operations to prevent race conditions
  const [localStorageOperationInProgress, setLocalStorageOperationInProgress] = useState(false);
  const localStorageQueue = useRef<Array<() => void>>([]);

  // Semaphore-controlled localStorage operations
  const executeWithSemaphore = async (operation: () => void) => {
    return new Promise<void>((resolve) => {
      const wrappedOperation = () => {
        try {
          operation();
        } finally {
          resolve();
          processNextOperation();
        }
      };

      if (localStorageOperationInProgress) {
        console.log('🚦 Operation queued - semaphore busy');
        localStorageQueue.current.push(wrappedOperation);
      } else {
        console.log('🚦 Acquiring semaphore for localStorage operation');
        setLocalStorageOperationInProgress(true);
        wrappedOperation();
      }
    });
  };

  const processNextOperation = () => {
    const nextOperation = localStorageQueue.current.shift();
    if (nextOperation) {
      console.log('🚦 Processing next queued operation');
      nextOperation();
    } else {
      console.log('🚦 Releasing semaphore - queue empty');
      setLocalStorageOperationInProgress(false);
    }
  };

  // Safe localStorage read with semaphore
  const safeReadFromLocalStorage = async (): Promise<KnowledgeEntry[]> => {
    return new Promise((resolve) => {
      executeWithSemaphore(() => {
        try {
          console.log('🔒 SAFE READ - Acquiring localStorage');
          const stored = localStorage.getItem('knowledgeBase_entries');
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log('🔒 SAFE READ - Found', parsed.length, 'entries');
            resolve(parsed);
          } else {
            console.log('🔒 SAFE READ - No data found');
            resolve([]);
          }
        } catch (error) {
          console.error('🔒 SAFE READ - Error:', error);
          resolve([]);
        }
      });
    });
  };

  // Safe localStorage write with semaphore
  const safeWriteToLocalStorage = async (entries: KnowledgeEntry[]): Promise<void> => {
    return executeWithSemaphore(() => {
      try {
        console.log('🔒 SAFE WRITE - Saving', entries.length, 'entries to localStorage');
        localStorage.setItem('knowledgeBase_entries', JSON.stringify(entries));
        
        // Verify the write
        const verification = localStorage.getItem('knowledgeBase_entries');
        const parsed = verification ? JSON.parse(verification) : [];
        console.log('🔒 SAFE WRITE - Verified', parsed.length, 'entries saved');
        
        if (parsed.length !== entries.length) {
          console.error('🔒 SAFE WRITE - VERIFICATION FAILED!');
        }
      } catch (error) {
        console.error('🔒 SAFE WRITE - Error:', error);
      }
    });
  };

  useEffect(() => {
    if (user) {
      // Double-check localStorage before API call
      const preAPICheck = localStorage.getItem('knowledgeBase_entries');
      console.log('🔍 PRE-API CHECK - localStorage contains:', preAPICheck ? JSON.parse(preAPICheck).length : 0, 'entries');
      
      // If we have data in localStorage but entries state is empty, reload from localStorage
      if (preAPICheck && entries.length === 0) {
        try {
          const storedEntries = JSON.parse(preAPICheck);
          if (storedEntries.length > 0) {
            console.log('🔄 RELOADING FROM LOCALSTORAGE - Found', storedEntries.length, 'entries');
            setEntries(storedEntries);
            setIsInitialLoad(false);
            return; // Skip fetch if we loaded from localStorage
          }
        } catch (error) {
          console.error('❌ Error parsing stored entries:', error);
        }
      }
      
      // Check if we need to migrate onboarding data
      migrateOnboardingDataIfNeeded();
      
      fetchKnowledgeBase();
    }
  }, [user, entries.length]);

  // Function to migrate onboarding data to knowledge base if needed
  const migrateOnboardingDataIfNeeded = async () => {
    try {
      console.log('🔄 MIGRATION - Checking if onboarding data needs migration...');
      
      // Check if knowledge base is empty
      const existingEntries = JSON.parse(localStorage.getItem('knowledgeBase_entries') || '[]');
      if (existingEntries.length > 0) {
        console.log('✅ MIGRATION - Knowledge base already has data, no migration needed');
        return;
      }

      // Check if we have user preferences that indicate completed onboarding
      const preferences = JSON.parse(localStorage.getItem(`preferences_${user?.id}`) || '{}');
      const userMetadata = user?.user_metadata;
      
      console.log('🔍 MIGRATION - Checking user data:', {
        hasUserMetadata: !!userMetadata,
        businessName: userMetadata?.business_name,
        hasPreferences: Object.keys(preferences).length > 0
      });

      // If user has business name in metadata, try to create a basic knowledge base entry
      if (userMetadata?.business_name) {
        console.log('🔄 MIGRATION - Creating knowledge base entry from onboarding data...');
        
        const migrationEntry = {
          id: `migration_${Date.now()}`,
          business_name: userMetadata.business_name,
          industry: userMetadata.industry || 'other', // Use proper industry value or default to 'other'
          target_audience: 'Not specified during onboarding',
          products_services: 'Not specified during onboarding',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('knowledgeBase_entries', JSON.stringify([migrationEntry]));
        
        // Also try to save to ML API for consistency
        try {
          const response = await fetch('https://socialdots-ai-expense-backend.hf.space/knowledge-base', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              business_name: migrationEntry.business_name,
              industry: migrationEntry.industry,
              target_audience: migrationEntry.target_audience,
              products_services: migrationEntry.products_services
            })
          });
          
          if (response.ok) {
            console.log('✅ MIGRATION - Successfully saved to ML API as well');
          } else {
            console.log('⚠️ MIGRATION - ML API save failed, but localStorage succeeded');
          }
        } catch (apiError) {
          console.log('⚠️ MIGRATION - ML API error:', apiError.message);
        }

        console.log('✅ MIGRATION - Created basic knowledge base entry from onboarding data');
        
        toast({
          title: "Knowledge Base Initialized",
          description: "We've created a basic knowledge base entry from your onboarding data. You can edit it to add more details.",
        });
      } else {
        console.log('ℹ️ MIGRATION - No onboarding data found to migrate');
      }

    } catch (error) {
      console.error('❌ MIGRATION - Error during migration:', error);
    }
  };

  // Debug effect to monitor entries changes
  useEffect(() => {
    console.log('🔍 KNOWLEDGE BASE DEBUG - Entries changed:', {
      entriesCount: entries.length,
      isInitialLoad,
      loading,
      userId: user?.id,
      entries: entries.map(e => ({ id: e.id, business_name: e.business_name }))
    });
    
    // Also check localStorage to see if there's a mismatch
    const stored = localStorage.getItem('knowledgeBase_entries');
    const storedCount = stored ? JSON.parse(stored).length : 0;
    if (storedCount !== entries.length) {
      console.warn('⚠️ STATE/LOCALSTORAGE MISMATCH - State:', entries.length, 'localStorage:', storedCount);
    }
  }, [entries, isInitialLoad, loading, user?.id]);

  // Debug effect to monitor form data changes
  useEffect(() => {
    console.log('📝 FORM DATA DEBUG:', formData);
  }, [formData]);

  // Periodic localStorage monitoring (for debugging)
  useEffect(() => {
    const checkLocalStorage = () => {
      const current = localStorage.getItem('knowledgeBase_entries');
      const count = current ? JSON.parse(current).length : 0;
      if (count !== entries.length) {
        console.warn('⚠️ LOCALSTORAGE MISMATCH - State:', entries.length, 'localStorage:', count);
      }
    };
    
    const interval = setInterval(checkLocalStorage, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [entries]);

  // Debug helper function (can be called from browser console)
  useEffect(() => {
    // Make debug functions available globally for troubleshooting
    (window as any).debugKnowledgeBase = () => {
      console.log('=== KNOWLEDGE BASE DEBUG INFO ===');
      console.log('Current entries in state:', entries.length);
      console.log('Entries data:', entries);
      
      const stored = localStorage.getItem('knowledgeBase_entries');
      console.log('Raw localStorage data:', stored);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('Parsed localStorage entries:', parsed.length);
          console.log('localStorage data:', parsed);
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      } else {
        console.log('No data in localStorage');
      }
      
      console.log('Loading state:', loading);
      console.log('Initial load:', isInitialLoad);
      console.log('User ID:', user?.id);
      console.log('Active tab:', activeTab);
      console.log('Form data:', formData);
      console.log('=== END DEBUG INFO ===');
    };

    // Add a test function to create a sample entry
    (window as any).testCreateKnowledgeEntry = () => {
      console.log('🧪 TESTING: Creating sample knowledge base entry...');
      const testEntry = {
        business_name: 'Test Business',
        industry: 'technology',
        target_audience: 'Tech professionals',
        products_services: 'Software solutions'
      };
      
      setFormData(testEntry);
      console.log('🧪 Test form data set:', testEntry);
      
      setTimeout(() => {
        createEntry();
      }, 1000);
    };
    
    return () => {
      delete (window as any).debugKnowledgeBase;
      delete (window as any).testCreateKnowledgeEntry;
    };
  }, [entries, loading, isInitialLoad, user, activeTab, formData]);

  // Add visibility change listener to preserve data when user navigates away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && entries.length > 0) {
        console.log('🔒 PAGE HIDDEN - Emergency save of', entries.length, 'entries to localStorage');
        safeWriteToLocalStorage(entries).catch(error => {
          console.error('❌ Emergency save failed:', error);
        });
      } else if (document.visibilityState === 'visible') {
        console.log('👁️ PAGE VISIBLE - Checking for data consistency');
        const storedEntries = JSON.parse(localStorage.getItem('knowledgeBase_entries') || '[]');
        if (storedEntries.length > entries.length) {
          console.log('🔄 RESTORING - Found more data in localStorage, restoring...');
          setEntries(storedEntries);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also add beforeunload as backup
    const handleBeforeUnload = () => {
      if (entries.length > 0) {
        console.log('🔒 BEFORE UNLOAD - Final save of', entries.length, 'entries');
        localStorage.setItem('knowledgeBase_entries', JSON.stringify(entries));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [entries]);

  // Save entries to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      console.log('💾 AUTO SAVE - Requesting semaphore for', entries.length, 'entries');
      safeWriteToLocalStorage(entries).then(() => {
        // Clear AI Assistant cache when knowledge base changes
        localStorage.removeItem('knowledgeBase_context');
        localStorage.removeItem('knowledgeBase_cached');
        
        // Trigger overview refresh by dispatching a custom event
        window.dispatchEvent(new CustomEvent('knowledgeBaseUpdated'));
        console.log('💾 AUTO SAVE - Complete with cache cleared and overview notified');
      });
    } else {
      console.log('⏭️ Skipping auto save (initial load)');
    }
  }, [entries, isInitialLoad]);

  const fetchKnowledgeBase = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🔄 FETCHING - Prioritizing user localStorage data over shared API...');
      
      // Always prioritize localStorage data for user's personal knowledge base
      const currentEntries = await safeReadFromLocalStorage();
      
      if (currentEntries.length > 0) {
        console.log('✅ USING LOCALSTORAGE - Found', currentEntries.length, 'personal entries, using them instead of API');
        setEntries(currentEntries);
        return;
      }
      
      console.log('💾 NO LOCALSTORAGE DATA - Checking if migration is needed or showing empty state');
      
      // If no localStorage data, show empty state (don't fetch from shared API)
      // The shared API contains example data that isn't user-specific
      console.log('📡 SKIPPING API FETCH - API contains shared/example data, not user-specific data');
      console.log('💡 RECOMMENDATION - Users should add their own data via the form');
      
      setEntries([]);
      
    } catch (error) {
      console.error('Error in fetchKnowledgeBase:', error);
      
      // Always keep existing localStorage data instead of clearing
      const fallbackEntries = await safeReadFromLocalStorage();
      if (fallbackEntries.length > 0) {
        console.log('🔄 FALLBACK - Using existing localStorage data:', fallbackEntries.length, 'entries');
        setEntries(fallbackEntries);
      } else {
        console.log('📭 EMPTY STATE - No data available');
        setEntries([]);
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Manual function to sync entries to localStorage with semaphore
  const syncToLocalStorage = (entriesToSave: KnowledgeEntry[]) => {
    console.log('💾 MANUAL SYNC - Requesting semaphore for', entriesToSave.length, 'entries');
    safeWriteToLocalStorage(entriesToSave).then(() => {
      // Clear AI Assistant cache when knowledge base changes
      localStorage.removeItem('knowledgeBase_context');
      localStorage.removeItem('knowledgeBase_cached');
      
      // Trigger overview refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('knowledgeBaseUpdated'));
      console.log('💾 MANUAL SYNC - Complete with cache cleared and overview notified');
    });
  };

  const fetchKnowledgeBasePreview = async () => {
    try {
      setPreviewLoading(true);
      console.log('🔍 Generating knowledge base preview from user data...');
      
      // Use current user's entries instead of fetching from shared API
      const userEntries = entries.length > 0 ? entries : await safeReadFromLocalStorage();
      
      if (userEntries.length === 0) {
        setKnowledgeBasePreview("No business information available to preview.\n\nAdd your business information using the form above to see how the AI will use it for personalized responses.");
        return;
      }
      
      // Generate a formatted preview of the user's business knowledge
      let preview = "=== YOUR BUSINESS KNOWLEDGE BASE ===\n\n";
      
      userEntries.forEach((entry, index) => {
        preview += `Business ${index + 1}:\n`;
        preview += `• Company: ${entry.business_name}\n`;
        preview += `• Industry: ${getIndustryLabel(entry.industry)}\n`;
        preview += `• Target Audience: ${entry.target_audience}\n`;
        preview += `• Products & Services: ${entry.products_services}\n`;
        if (entry.created_at) {
          preview += `• Added: ${new Date(entry.created_at).toLocaleDateString()}\n`;
        }
        preview += "\n" + "=".repeat(50) + "\n\n";
      });
      
      preview += "HOW AI USES THIS INFORMATION:\n";
      preview += "• Provides personalized business advice\n";
      preview += "• Creates content relevant to your industry\n";
      preview += "• Understands your target audience for marketing suggestions\n";
      preview += "• Gives context-aware recommendations for your specific business\n";
      
      console.log('✅ Generated preview from', userEntries.length, 'user entries');
      setKnowledgeBasePreview(preview);
      
    } catch (error) {
      console.error('Error generating knowledge base preview:', error);
      toast({
        title: "Error",
        description: "Failed to generate knowledge base preview",
        variant: "destructive"
      });
      setKnowledgeBasePreview("Unable to generate knowledge base preview from your data");
    } finally {
      setPreviewLoading(false);
    }
  };

  const createEntry = async () => {
    console.log('🚀 CREATE ENTRY CALLED - Form Data:', formData);
    console.log('🔍 Validation Check:', {
      business_name: !!formData.business_name,
      industry: !!formData.industry,
      target_audience: !!formData.target_audience,
      products_services: !!formData.products_services
    });

    if (!formData.business_name || !formData.industry || !formData.target_audience || !formData.products_services) {
      console.log('❌ VALIDATION FAILED - Missing required fields');
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create the new entry object first
      const newEntry: KnowledgeEntry = {
        id: Date.now().toString(), // Generate unique ID
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services,
        created_at: new Date().toISOString()
      };
      
      console.log('🆕 Creating new entry:', newEntry);
      console.log('📝 Form data target_audience value:', formData.target_audience);
      console.log('📝 Form data target_audience length:', formData.target_audience.length);
      
      // Add to local state immediately for instant feedback
      setEntries(prev => {
        const updated = [newEntry, ...prev];
        console.log('📝 Updated entries array:', updated.length);
        console.log('📝 Previous entries:', prev.length);
        console.log('📝 New entry being added:', newEntry);
        console.log('📝 Full updated array:', updated);
        // Immediately sync to localStorage to ensure persistence
        syncToLocalStorage(updated);
        return updated;
      });
      
      // Try to sync with API in background (optional)
      try {
        console.log('📡 Attempting API sync (optional)...');
        const response = await fetch('https://socialdots-ai-expense-backend.hf.space/knowledge-base', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business_name: formData.business_name,
            industry: formData.industry,
            target_audience: formData.target_audience,
            products_services: formData.products_services
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ API sync successful:', result);
        } else {
          console.warn('⚠️ API sync failed, but entry saved locally');
        }
      } catch (apiError) {
        console.warn('⚠️ API sync failed, but entry saved locally:', apiError);
      }
      
      toast({
        title: "Success",
        description: "Business information saved to knowledge base successfully"
      });
      
      // Clear form after successful creation
      setFormData({ 
        business_name: '', 
        industry: '', 
        target_audience: '', 
        products_services: '' 
      });
      setSelectedTargetAudience("");
      setIsCustomTargetAudience(false);
      
      // Switch to browse tab to show the new entry
      setActiveTab("browse");
      
    } catch (error) {
      console.error('❌ Unexpected error in createEntry:', error);
      
      toast({
        title: "Error", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!entryId) return;
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this business information? This action cannot be undone."
    );
    
    if (!confirmDelete) return;

    try {
      setLoading(true);
      console.log('Attempting to delete knowledge base entry:', entryId);
      
      // Delete from ML API using DELETE endpoint
      try {
        const response = await fetch(`https://socialdots-ai-expense-backend.hf.space/knowledge-base/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('ML API DELETE response status:', response.status);
        
        if (response.ok) {
          console.log('✅ API delete successful');
        } else if (response.status !== 404) {
          const errorText = await response.text();
          console.error('ML API DELETE error:', errorText);
          // Continue with local removal even if API delete fails
        } else {
          console.warn('⚠️ API delete failed (404 - endpoint not found), falling back to local delete');
        }
      } catch (deleteError) {
        console.warn('ML API DELETE error:', deleteError);
        // Continue with local removal even if API delete fails
      }
      
      // Remove from local state regardless of API success
      setEntries(prev => {
        const updated = prev.filter(entry => entry.id !== entryId);
        syncToLocalStorage(updated);
        return updated;
      });
      
      toast({
        title: "Success",
        description: "Business information deleted successfully"
      });
      
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete business information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async () => {
    if (!editingEntry || !formData.business_name || !formData.industry || !formData.target_audience || !formData.products_services) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Updating knowledge base entry locally:', {
        id: editingEntry.id,
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services
      });
      
      // Try to update via API first, fallback to local-only update
      let apiUpdateSuccessful = false;
      
      try {
        console.log('📡 Attempting API update...');
        const response = await fetch(`https://socialdots-ai-expense-backend.hf.space/knowledge-base/${editingEntry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business_name: formData.business_name,
            industry: formData.industry,
            target_audience: formData.target_audience,
            products_services: formData.products_services
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ API update successful:', result);
          apiUpdateSuccessful = true;
        } else {
          console.warn('⚠️ API update failed, falling back to local update');
        }
      } catch (apiError) {
        console.warn('⚠️ API update failed, falling back to local update:', apiError);
      }

      // Update local state regardless of API success
      const updatedEntry: KnowledgeEntry = {
        ...editingEntry,
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services,
        updated_at: new Date().toISOString()
      };
      
      const updatedEntries = entries.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      );
      
      // Update state and localStorage
      setEntries(updatedEntries);
      await safeWriteToLocalStorage(updatedEntries);
      
      // Clear AI Assistant cache when knowledge base changes
      localStorage.removeItem('knowledgeBase_context');
      localStorage.removeItem('knowledgeBase_cached');
      
      // Trigger overview refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('knowledgeBaseUpdated'));
      
      console.log('Knowledge base entry updated successfully in localStorage');
      
      toast({
        title: "Success",
        description: "Business information updated successfully"
      });
      
      // Clear editing state and switch back to browse tab
      setEditingEntry(null);
      setActiveTab("browse");
      setFormData({ 
        business_name: '', 
        industry: '', 
        target_audience: '', 
        products_services: '' 
      });
      setOriginalFormData({
        business_name: '', 
        industry: '', 
        target_audience: '', 
        products_services: '' 
      });
      setSelectedTargetAudience("");
      setIsCustomTargetAudience(false);
      
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update knowledge entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if form data has changed from original
  const hasFormChanged = () => {
    return (
      formData.business_name !== originalFormData.business_name ||
      formData.industry !== originalFormData.industry ||
      formData.target_audience !== originalFormData.target_audience ||
      formData.products_services !== originalFormData.products_services
    );
  };

  const startEditing = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setActiveTab("edit"); // Switch to edit tab
    const entryData = {
      business_name: entry.business_name,
      industry: entry.industry,
      target_audience: entry.target_audience,
      products_services: entry.products_services
    };
    setFormData(entryData);
    setOriginalFormData(entryData); // Store original data for comparison
    
    // Check if target audience matches a predefined option
    const matchingOption = TARGET_AUDIENCE_OPTIONS.find(opt => 
      opt.label.toLowerCase() === entry.target_audience.toLowerCase() ||
      opt.value === entry.target_audience
    );
    
    if (matchingOption) {
      setSelectedTargetAudience(matchingOption.value);
      setIsCustomTargetAudience(false);
    } else {
      setSelectedTargetAudience("custom");
      setIsCustomTargetAudience(true);
    }
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setActiveTab("browse"); // Switch back to browse tab
    setFormData({ 
      business_name: '', 
      industry: '', 
      target_audience: '', 
      products_services: '' 
    });
    setOriginalFormData({
      business_name: '', 
      industry: '', 
      target_audience: '', 
      products_services: '' 
    });
    setSelectedTargetAudience("");
    setIsCustomTargetAudience(false);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Business Knowledge Base</h2>
          <p className="text-muted-foreground">
            {entries.length > 0 
              ? "Edit or delete your business information. Business information is typically added during onboarding."
              : "No business information found. Business information is added during the onboarding process."
            }
          </p>
        </div>
      </div>

      {entries.length > 0 || editingEntry ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            {!editingEntry && (
              <TabsTrigger value="browse">Business Information</TabsTrigger>
            )}
            {!editingEntry && entries.length > 0 && (
              <TabsTrigger value="preview">AI Preview</TabsTrigger>
            )}
            {!editingEntry && entries.length > 0 && (
              <TabsTrigger value="add">Add Information</TabsTrigger>
            )}
            {editingEntry && (
              <TabsTrigger value="edit">Edit Business Information</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Your stored business knowledge for AI assistance</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p>Loading business information...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No business information found</p>
                    <p className="text-sm">Business information is added during onboarding</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry, index) => (
                      <div key={entry.id || index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <h4 className="font-medium text-lg">{entry.business_name}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-start gap-2">
                                <Target className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <span className="font-medium">Industry:</span>
                                  <p className="text-muted-foreground">{getIndustryLabel(entry.industry)}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <span className="font-medium">Target Audience:</span>
                                  <div className="text-muted-foreground whitespace-pre-line" title={`Full value: ${entry.target_audience}`}>
                                    {entry.target_audience}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div>
                                <span className="font-medium">Products & Services:</span>
                                <div className="text-muted-foreground text-sm line-clamp-3 whitespace-pre-line">{entry.products_services}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startEditing(entry)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteEntry(entry.id || '')}
                              disabled={loading}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        {entry.created_at && (
                          <div className="flex justify-end">
                            <span className="text-xs text-muted-foreground">
                              Added {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Knowledge Base Preview
                </CardTitle>
                <CardDescription>
                  See how your business information appears to the AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      This is how the AI sees your business information when providing responses
                    </p>
                    <Button 
                      onClick={fetchKnowledgeBasePreview}
                      disabled={previewLoading}
                      size="sm"
                      variant="outline"
                    >
                      {previewLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Refresh Preview
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-muted/20 min-h-[200px]">
                    {previewLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : knowledgeBasePreview ? (
                      <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-[400px]">
                        {knowledgeBasePreview}
                      </pre>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Click "Refresh Preview" to see your formatted knowledge base</p>
                        <p className="text-sm">This shows how AI will use your business information</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      💡 How AI Uses This Information
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      This formatted knowledge base is automatically included when you chat with the AI assistant, 
                      helping it provide personalized responses about your business, create relevant content, 
                      and give contextual advice.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Edit Business Information
                </CardTitle>
                <CardDescription>
                  Update your business details to help AI provide better assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Business Name
                  </Label>
                  <Input 
                    id="business_name" 
                    placeholder="Your Company Name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Industry
                  </Label>
                  <Select 
                    value={formData.industry}
                    onValueChange={(value) => setFormData({...formData, industry: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Target Audience
                  </Label>
                  <Select 
                    value={selectedTargetAudience}
                    onValueChange={(value) => {
                      setSelectedTargetAudience(value);
                      if (value === "custom") {
                        setIsCustomTargetAudience(true);
                      } else {
                        setIsCustomTargetAudience(false);
                        const selectedOption = TARGET_AUDIENCE_OPTIONS.find(opt => opt.value === value);
                        setFormData({...formData, target_audience: selectedOption?.label || value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_AUDIENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {isCustomTargetAudience && (
                    <Input 
                      id="custom_target_audience" 
                      placeholder="Enter your specific target audience"
                      value={formData.target_audience}
                      onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="products_services" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products & Services
                  </Label>
                  <Textarea 
                    id="products_services" 
                    placeholder="Describe your main products and services in detail..."
                    value={formData.products_services}
                    onChange={(e) => setFormData({...formData, products_services: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={updateEntry}
                    disabled={loading || !hasFormChanged()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Information"}
                  </Button>
                  <Button 
                    onClick={cancelEditing}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Business Information
                </CardTitle>
                <CardDescription>
                  Add additional products, services, or other business details to your existing business profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add_products_services" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Additional Products & Services
                  </Label>
                  <Textarea 
                    id="add_products_services" 
                    placeholder="Describe additional products, services, or business information..."
                    value={formData.products_services}
                    onChange={(e) => setFormData({...formData, products_services: e.target.value})}
                    rows={6}
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    💡 Adding to Existing Business
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    This will be added to your existing business profile. Use this to add new products, services, 
                    target markets, or any other relevant business information.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={async () => {
                      console.log('🖱️ TAB BUTTON CLICKED - Add Information to Business');
                      if (!formData.products_services.trim()) {
                        toast({
                          title: "Error",
                          description: "Please enter the additional business information",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Get the first business entry and add to its products_services
                      if (entries.length > 0) {
                        const firstEntry = entries[0];
                        const updatedEntry = {
                          ...firstEntry,
                          products_services: firstEntry.products_services + '\n\n' + formData.products_services,
                          updated_at: new Date().toISOString()
                        };
                        
                        try {
                          setLoading(true);
                          
                          // Update local state immediately
                          const updatedEntries = entries.map(entry => 
                            entry.id === firstEntry.id ? updatedEntry : entry
                          );
                          
                          console.log('🔄 Updating entry:', firstEntry.id);
                          console.log('📝 Original products_services:', firstEntry.products_services);
                          console.log('➕ Adding:', formData.products_services);
                          console.log('✅ Updated products_services:', updatedEntry.products_services);
                          
                          // Update state and wait for localStorage sync
                          setEntries(updatedEntries);
                          await safeWriteToLocalStorage(updatedEntries);
                          
                          // Clear AI Assistant cache when knowledge base changes
                          localStorage.removeItem('knowledgeBase_context');
                          localStorage.removeItem('knowledgeBase_cached');
                          
                          // Trigger overview refresh by dispatching a custom event
                          window.dispatchEvent(new CustomEvent('knowledgeBaseUpdated'));
                          
                          toast({
                            title: "Success",
                            description: "Additional information added to your business profile"
                          });
                          
                          // Clear form and switch back to browse tab
                          setFormData({ 
                            business_name: '', 
                            industry: '', 
                            target_audience: '', 
                            products_services: '' 
                          });
                          setActiveTab("browse");
                          
                        } catch (error) {
                          console.error('Error adding information:', error);
                          toast({
                            title: "Error",
                            description: "Failed to add information to business profile",
                            variant: "destructive"
                          });
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Adding..." : "Add to Business Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      ) : (
        // Show add form when no entries exist
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Entry
            </CardTitle>
            <CardDescription>
              Add your business details to help AI provide personalized assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Business Name
              </Label>
              <Input 
                id="business_name" 
                placeholder="Your Company Name"
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Industry
              </Label>
              <Select 
                value={formData.industry}
                onValueChange={(value) => setFormData({...formData, industry: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Audience
              </Label>
              <Select 
                value={selectedTargetAudience}
                onValueChange={(value) => {
                  setSelectedTargetAudience(value);
                  if (value === "custom") {
                    setIsCustomTargetAudience(true);
                  } else {
                    setIsCustomTargetAudience(false);
                    const selectedOption = TARGET_AUDIENCE_OPTIONS.find(opt => opt.value === value);
                    setFormData({...formData, target_audience: selectedOption?.label || value});
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_AUDIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isCustomTargetAudience && (
                <Input 
                  id="custom_target_audience" 
                  placeholder="Enter your specific target audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="products_services" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products & Services
              </Label>
              <Textarea 
                id="products_services" 
                placeholder="Describe your main products and services in detail..."
                value={formData.products_services}
                onChange={(e) => setFormData({...formData, products_services: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => {
                  console.log('🖱️ BUTTON CLICKED - Add to Knowledge Base');
                  createEntry();
                }}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Saving..." : "Add to Knowledge Base"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}