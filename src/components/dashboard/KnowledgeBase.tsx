import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
      fetchKnowledgeBase();
    }
  }, [user]);

  // Debug effect to monitor entries changes
  useEffect(() => {
    console.log('🔍 KNOWLEDGE BASE DEBUG - Entries changed:', {
      entriesCount: entries.length,
      isInitialLoad,
      entries: entries.map(e => ({ id: e.id, business_name: e.business_name }))
    });
  }, [entries, isInitialLoad]);

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

  // Save entries to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      console.log('💾 AUTO SAVE - Requesting semaphore for', entries.length, 'entries');
      safeWriteToLocalStorage(entries).then(() => {
        // Clear AI Assistant cache when knowledge base changes
        localStorage.removeItem('knowledgeBase_context');
        localStorage.removeItem('knowledgeBase_cached');
        console.log('💾 AUTO SAVE - Complete with cache cleared');
      });
    } else {
      console.log('⏭️ Skipping auto save (initial load)');
    }
  }, [entries, isInitialLoad]);

  const fetchKnowledgeBase = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Attempting to fetch knowledge base from ML API...');
      
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/knowledge-base', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('ML API fetch response status:', response.status);
      console.log('ML API fetch response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        // If GET endpoint doesn't exist, just show empty state
        if (response.status === 404 || response.status === 405) {
          console.log('GET endpoint not available, showing empty state');
          setEntries([]);
          return;
        }
        throw new Error(`Failed to fetch knowledge base: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('ML API fetch response data:', data);
      const apiEntries = Array.isArray(data) ? data : [];
      
      // Get current localStorage data to compare using semaphore
      const currentEntries = await safeReadFromLocalStorage();
      
      // Only update if we got meaningful data from API
      // Don't override localStorage with empty API responses
      if (apiEntries.length > 0) {
        console.log('API returned data, updating entries:', apiEntries);
        setEntries(apiEntries);
      } else if (currentEntries.length === 0) {
        // Only set empty if localStorage is also empty (fresh user)
        console.log('Both API and localStorage are empty, showing empty state');
        setEntries([]);
      } else {
        // Keep localStorage data if API is empty but localStorage has data
        console.log('API returned empty but localStorage has data, keeping localStorage entries:', currentEntries.length);
        // Don't call setEntries to avoid triggering the save effect
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      
      // Don't show error toast if it's just that the GET endpoint doesn't exist
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error or CORS issue, keeping existing localStorage data');
      } else {
        // Keep existing localStorage data instead of clearing
        console.log('API error, keeping existing localStorage data');
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
      console.log('💾 MANUAL SYNC - Complete with cache cleared');
    });
  };

  const fetchKnowledgeBasePreview = async () => {
    try {
      setPreviewLoading(true);
      console.log('Fetching knowledge base preview...');
      
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/get-knowledge-base');
      
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge base preview');
      }
      
      const data = await response.json();
      console.log('Knowledge base preview data:', data);
      
      // Handle different possible response formats
      const preview = data.formatted_knowledge || data.content || data.knowledge_base || JSON.stringify(data, null, 2);
      setKnowledgeBasePreview(preview);
      
    } catch (error) {
      console.error('Error fetching knowledge base preview:', error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge base preview",
        variant: "destructive"
      });
      setKnowledgeBasePreview("Unable to load knowledge base preview");
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
      console.log('Creating knowledge base entry via ML API:', {
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services
      });
      
      const response = await fetch('https://dawoodAhmad12-ai-expense-backend.hf.space/knowledge-base', {
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

      console.log('ML API POST response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ML API POST error:', errorText);
        throw new Error(`Failed to create knowledge entry: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Knowledge base entry created successfully:', result);
      
      toast({
        title: "Success",
        description: "Business information saved to knowledge base successfully"
      });
      
      // Add the new entry to local state with the ID returned from API
      const newEntry: KnowledgeEntry = {
        id: result.id || result.entry_id || Date.now().toString(), // Handle different possible ID field names
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services,
        created_at: result.created_at || new Date().toISOString()
      };
      console.log('🆕 Adding new entry to state:', newEntry);
      setEntries(prev => {
        const updated = [newEntry, ...prev];
        console.log('📝 Updated entries array:', updated.length);
        // Immediately sync to localStorage to ensure persistence
        syncToLocalStorage(updated);
        return updated;
      });
      
      // Clear form after successful creation
      setFormData({ 
        business_name: '', 
        industry: '', 
        target_audience: '', 
        products_services: '' 
      });
      
      // Switch to browse tab to show the new entry
      setActiveTab("browse");
      
    } catch (error) {
      console.error('Error creating knowledge entry via API:', error);
      
      // Even if API fails, save to localStorage so user doesn't lose data
      console.log('API failed, saving entry to localStorage only');
      const fallbackEntry: KnowledgeEntry = {
        id: Date.now().toString(),
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services,
        created_at: new Date().toISOString()
      };
      
      setEntries(prev => {
        const updated = [fallbackEntry, ...prev];
        syncToLocalStorage(updated);
        return updated;
      });
      
      toast({
        title: "Saved Locally",
        description: "Business information saved locally. It will sync to the server when available.",
        variant: "default"
      });
      
      // Clear form after successful local save
      setFormData({ 
        business_name: '', 
        industry: '', 
        target_audience: '', 
        products_services: '' 
      });
      
      // Switch to browse tab to show the new entry
      setActiveTab("browse");
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
        const response = await fetch(`https://dawoodAhmad12-ai-expense-backend.hf.space/knowledge-base/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('ML API DELETE response status:', response.status);
        
        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          console.error('ML API DELETE error:', errorText);
          // Continue with local removal even if API delete fails
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
      console.log('Updating knowledge base entry via ML API:', {
        id: editingEntry.id,
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services
      });
      
      // Update via ML API using the PUT endpoint
      const response = await fetch(`https://dawoodAhmad12-ai-expense-backend.hf.space/knowledge-base/${editingEntry.id}`, {
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

      console.log('ML API PUT response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ML API PUT error:', errorText);
        throw new Error(`Failed to update knowledge entry: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Knowledge base entry updated successfully via ML API:', result);
      
      // Update local state regardless of API success
      const updatedEntry: KnowledgeEntry = {
        ...editingEntry,
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services,
        updated_at: new Date().toISOString()
      };
      
      setEntries(prev => {
        const updated = prev.map(entry => 
          entry.id === editingEntry.id ? updatedEntry : entry
        );
        syncToLocalStorage(updated);
        return updated;
      });
      
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
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Business Knowledge Base</h2>
          <p className="text-muted-foreground">
            {entries.length > 0 
              ? "Edit or delete your business information. Business information is typically added during onboarding."
              : "No business information found. Business information is added during the onboarding process, or you can add it manually below."
            }
          </p>
        </div>
        <Button className="gap-2" onClick={() => {
          setEditingEntry(null);
          setActiveTab("add");
          console.log('🆕 Add Business Info button clicked');
        }}>
          <Plus className="h-4 w-4" />
          {entries.length === 0 ? "Add Business Info" : "Add New Business"}
        </Button>
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
            {!editingEntry && (
              <TabsTrigger value="add">Add New Business</TabsTrigger>
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
                                  <p className="text-muted-foreground">{entry.industry}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <span className="font-medium">Target Audience:</span>
                                  <p className="text-muted-foreground">{entry.target_audience}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div>
                                <span className="font-medium">Products & Services:</span>
                                <p className="text-muted-foreground text-sm line-clamp-3">{entry.products_services}</p>
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
                  <Input 
                    id="industry" 
                    placeholder="e.g., Technology, Healthcare, Retail, Consulting"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Target Audience
                  </Label>
                  <Input 
                    id="target_audience" 
                    placeholder="e.g., Small businesses, Students, Enterprise clients"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                  />
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
                  Add New Business Information
                </CardTitle>
                <CardDescription>
                  Add additional business details to expand your knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add_business_name" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Business Name
                  </Label>
                  <Input 
                    id="add_business_name" 
                    placeholder="Your Company Name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="add_industry" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Industry
                  </Label>
                  <Input 
                    id="add_industry" 
                    placeholder="e.g., Technology, Healthcare, Retail, Consulting"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_target_audience" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Target Audience
                  </Label>
                  <Input 
                    id="add_target_audience" 
                    placeholder="e.g., Small businesses, Students, Enterprise clients"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_products_services" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products & Services
                  </Label>
                  <Textarea 
                    id="add_products_services" 
                    placeholder="Describe your main products and services in detail..."
                    value={formData.products_services}
                    onChange={(e) => setFormData({...formData, products_services: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => {
                      console.log('🖱️ TAB BUTTON CLICKED - Add to Knowledge Base');
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
          </TabsContent>
        </Tabs>
      ) : (
        // Show add form only when no entries exist
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Business Information
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
              <Input 
                id="industry" 
                placeholder="e.g., Technology, Healthcare, Retail, Consulting"
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Audience
              </Label>
              <Input 
                id="target_audience" 
                placeholder="e.g., Small businesses, Students, Enterprise clients"
                value={formData.target_audience}
                onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
              />
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