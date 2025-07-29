import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search, Edit3, Trash2, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  created_at: string;
  updated_at: string;
}

export function KnowledgeBase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  });
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);

  useEffect(() => {
    if (user) {
      fetchKnowledgeBase();
    }
  }, [user]);

  const fetchKnowledgeBase = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-knowledge-base-by-user', {
        body: { userId: user.id }
      });
      
      if (error) throw error;
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge base",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Error", 
        description: "Please fill in title and content",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-knowledge-base-entry', {
        body: {
          userId: user?.id,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Knowledge entry created successfully"
      });
      
      setFormData({ title: '', content: '', category: '', tags: '' });
      await fetchKnowledgeBase();
    } catch (error) {
      console.error('Error creating entry:', error);
      toast({
        title: "Error",
        description: "Failed to create knowledge entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async () => {
    if (!editingEntry || !formData.title || !formData.content) return;

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('update-knowledge-base-entry', {
        body: {
          entryId: editingEntry.id,
          userId: user?.id,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Knowledge entry updated successfully"
      });
      
      setEditingEntry(null);
      setFormData({ title: '', content: '', category: '', tags: '' });
      await fetchKnowledgeBase();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update knowledge entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('delete-knowledge-base-entry', {
        body: { entryId, userId: user?.id }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Knowledge entry deleted successfully"
      });
      
      await fetchKnowledgeBase();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category || '',
      tags: entry.tags?.join(', ') || ''
    });
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setFormData({ title: '', content: '', category: '', tags: '' });
  };

  const filteredEntries = entries.filter(entry =>
    entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags?.some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Knowledge Base</h2>
          <p className="text-muted-foreground">Store and organize your business knowledge and documentation</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="add">Add Entry</TabsTrigger>
          <TabsTrigger value="linked">Linked to Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search entries, tags, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Knowledge Entries</CardTitle>
              <CardDescription>Your business knowledge and documentation</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading knowledge base...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No knowledge entries found</p>
                  <p className="text-sm">Add your first entry to build your knowledge base</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <div key={entry.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{entry.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                            {entry.content}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing(entry)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteEntry(entry.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.category && (
                          <Badge variant="secondary">{entry.category}</Badge>
                        )}
                        {entry.tags?.map((tag, index) => (
                          <Badge key={index} variant="outline">#{tag}</Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {editingEntry ? "Edit Knowledge Entry" : "Add Knowledge Entry"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="Entry title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea 
                  id="content" 
                  placeholder="Enter your knowledge content..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input 
                    id="category" 
                    placeholder="Category (optional)"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input 
                    id="tags" 
                    placeholder="tag1, tag2, tag3"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={editingEntry ? updateEntry : createEntry}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Saving..." : editingEntry ? "Update Entry" : "Add Entry"}
                </Button>
                {editingEntry && (
                  <Button 
                    onClick={cancelEditing}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="linked">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Expense-Linked Knowledge
              </CardTitle>
              <CardDescription>Knowledge entries linked to your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No linked knowledge entries yet</p>
                <p className="text-sm">Link knowledge entries to expenses for better organization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}