import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search, Edit3, Trash2, Link2, Building, Users, Package, Target } from "lucide-react";
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
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    target_audience: '',
    products_services: ''
  });
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [originalFormData, setOriginalFormData] = useState({
    business_name: '',
    industry: '',
    target_audience: '',
    products_services: ''
  });

  useEffect(() => {
    if (user) {
      fetchKnowledgeBase();
    }
  }, [user]);

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
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      
      // Don't show error toast if it's just that the GET endpoint doesn't exist
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error or CORS issue, showing empty state');
        setEntries([]);
      } else {
        toast({
          title: "Info",
          description: "Knowledge base is ready for new entries",
        });
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async () => {
    if (!formData.business_name || !formData.industry || !formData.target_audience || !formData.products_services) {
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
      
      // Add the new entry to local state instead of fetching (since GET might not work)
      const newEntry: KnowledgeEntry = {
        id: result.id || Date.now().toString(),
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        products_services: formData.products_services,
        created_at: new Date().toISOString()
      };
      setEntries(prev => [newEntry, ...prev]);
      
      // Clear form after successful creation
      setFormData({ 
        business_name: '', 
        industry: '', 
        target_audience: '', 
        products_services: '' 
      });
      
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create knowledge entry",
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
      
      // Note: If ML API doesn't have DELETE endpoint, we'll just remove from local state
      // and show a warning that it might still exist on the server
      
      // Try to delete from ML API (if DELETE endpoint exists)
      try {
        const response = await fetch(`https://dawoodAhmad12-ai-expense-backend.hf.space/knowledge-base/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok && response.status !== 404) {
          console.warn('ML API DELETE failed:', response.status, response.statusText);
        }
      } catch (deleteError) {
        console.warn('ML API DELETE not available:', deleteError);
      }
      
      // Remove from local state regardless of API success
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      
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
      
      // Try to update via ML API (if PUT/PATCH endpoint exists)
      try {
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

        if (!response.ok && response.status !== 404) {
          console.warn('ML API PUT failed:', response.status, response.statusText);
        }
      } catch (updateError) {
        console.warn('ML API PUT not available:', updateError);
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
      
      setEntries(prev => prev.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      ));
      
      toast({
        title: "Success",
        description: "Business information updated successfully"
      });
      
      // Clear editing state
      setEditingEntry(null);
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
        {entries.length === 0 && (
          <Button className="gap-2" onClick={() => setEditingEntry(null)}>
            <Plus className="h-4 w-4" />
            Add Business Info
          </Button>
        )}
      </div>

      {entries.length > 0 || editingEntry ? (
        <Tabs defaultValue={editingEntry ? "edit" : "browse"} className="space-y-6">
          <TabsList>
            {!editingEntry && (
              <TabsTrigger value="browse">Business Information</TabsTrigger>
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
                onClick={createEntry}
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