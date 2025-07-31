import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronDown, ChevronRight, Filter, Receipt, Edit3, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay, parseISO } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";

interface Expense {
  id: string;
  amount: number;
  title?: string;
  description?: string;
  category: string;
  date?: string;
  created_at?: string;
  receipt_url?: string;
  status?: string;
}

interface ExpenseHistoryProps {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

type ViewMode = 'today' | 'week' | 'month' | 'year' | 'custom';

interface GroupedExpenses {
  [date: string]: {
    expenses: Expense[];
    total: number;
    expanded: boolean;
  };
}

export function ExpenseHistory({ expenses, loading, onEdit, onDelete }: ExpenseHistoryProps) {
  const { formatAmount } = useCurrency();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Filter expenses based on view mode and selected date
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    
    return expenses.filter(expense => {
      const expenseDate = expense.date ? parseISO(expense.date) : (expense.created_at ? new Date(expense.created_at) : now);
      
      switch (viewMode) {
        case 'today':
          return isSameDay(expenseDate, now);
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          return expenseDate >= startOfDay(weekStart) && expenseDate <= endOfDay(weekEnd);
        case 'month':
          return expenseDate >= startOfMonth(selectedDate) && expenseDate <= endOfMonth(selectedDate);
        case 'year':
          return expenseDate >= startOfYear(selectedDate) && expenseDate <= endOfYear(selectedDate);
        case 'custom':
          return isSameDay(expenseDate, selectedDate);
        default:
          return true;
      }
    });
  }, [expenses, viewMode, selectedDate]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const grouped: GroupedExpenses = {};
    
    filteredExpenses.forEach(expense => {
      const expenseDate = expense.date ? parseISO(expense.date) : (expense.created_at ? new Date(expense.created_at) : new Date());
      const dateKey = format(expenseDate, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          expenses: [],
          total: 0,
          expanded: viewMode === 'today' || expandedDates.has(dateKey)
        };
      }
      
      grouped[dateKey].expenses.push(expense);
      grouped[dateKey].total += expense.amount;
    });

    // Sort by date (newest first)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as GroupedExpenses);
  }, [filteredExpenses, viewMode, expandedDates]);

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalCount = filteredExpenses.length;

  const toggleDateExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const getViewModeTitle = () => {
    switch (viewMode) {
      case 'today':
        return 'Today\'s Expenses';
      case 'week':
        return 'This Week\'s Expenses';
      case 'month':
        return `${format(selectedDate, 'MMMM yyyy')} Expenses`;
      case 'year':
        return `${format(selectedDate, 'yyyy')} Expenses`;
      case 'custom':
        return `${format(selectedDate, 'MMMM d, yyyy')} Expenses`;
      default:
        return 'All Expenses';
    }
  };

  // Auto-expand today's expenses
  useEffect(() => {
    if (viewMode === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd');
      setExpandedDates(new Set([today]));
    }
  }, [viewMode]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p>Loading expenses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {getViewModeTitle()}
            </CardTitle>
            <CardDescription>
              {totalCount > 0 
                ? `${totalCount} expenses • ${formatAmount(totalAmount)} total`
                : 'No expenses found for this period'
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>
            
            {(viewMode === 'month' || viewMode === 'year' || viewMode === 'custom') && (
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {viewMode === 'custom' 
                      ? format(selectedDate, 'MMM d, yyyy')
                      : viewMode === 'year'
                      ? format(selectedDate, 'yyyy')
                      : format(selectedDate, 'MMM yyyy')
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedExpenses).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No expenses found</p>
            <p className="text-sm">
              {viewMode === 'today' 
                ? 'No expenses logged today'
                : `No expenses found for ${getViewModeTitle().toLowerCase()}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedExpenses).map(([dateKey, data]) => (
              <div key={dateKey} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleDateExpansion(dateKey)}
                >
                  <div className="flex items-center gap-3">
                    {data.expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-medium">
                        {format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {data.expenses.length} expense{data.expenses.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="font-semibold text-lg">
                    {formatAmount(data.total)}
                  </div>
                </div>
                
                {data.expanded && (
                  <div className="border-t">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{expense.title || 'Untitled'}</div>
                                {expense.description && (
                                  <div className="text-sm text-muted-foreground">
                                    {expense.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{expense.category}</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatAmount(expense.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={expense.status === 'approved' ? 'default' : 'secondary'}>
                                {expense.status || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(expense);
                                  }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(expense.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}