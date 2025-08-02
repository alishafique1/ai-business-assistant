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
import { useTimezone } from "@/hooks/useTimezone";

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
  const { formatExpenseDate, formatDateTime, getTimezoneDisplay } = useTimezone();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Filter expenses based on view mode and selected date
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now); // Get start of today in local timezone
    
    console.log('🔍 FILTERING EXPENSES - TOTAL:', expenses.length, 'View mode:', viewMode);
    
    return expenses.filter(expense => {
      // Handle date parsing more carefully - manual expenses should use expense.date (YYYY-MM-DD format)
      // while ML API expenses might use created_at (full timestamp)
      let expenseDate: Date;
      
      if (expense.date) {
        // For manual expenses: expense.date is in YYYY-MM-DD format
        expenseDate = parseISO(expense.date);
      } else if (expense.created_at) {
        // For ML API expenses: created_at is a full timestamp
        expenseDate = new Date(expense.created_at);
      } else {
        // Fallback to current time
        expenseDate = now;
      }
      
      switch (viewMode) {
        case 'today': {
          // Compare dates at day level, not exact timestamps
          const expenseDayStart = startOfDay(expenseDate);
          const isToday = isSameDay(expenseDayStart, today);
          console.log('🗓️ TODAY FILTER DEBUG:', {
            expenseId: expense.id,
            expenseTitle: expense.title,
            rawExpenseDate: expense.date,
            rawCreatedAt: expense.created_at,
            parsedExpenseDate: expenseDate,
            expenseDayStart: expenseDayStart,
            currentDate: now,
            todayStart: today,
            isSameDay: isToday,
            isManualExpense: expense.id && expense.id.length === 36 && expense.id.includes('-')
          });
          return isToday;
        }
        case 'week': {
          const currentDate = new Date(); // Don't mutate the original now variable
          const weekStart = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
          const weekEnd = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 6));
          return expenseDate >= startOfDay(weekStart) && expenseDate <= endOfDay(weekEnd);
        }
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
      // Use same date parsing logic as filtering
      let expenseDate: Date;
      if (expense.date) {
        expenseDate = parseISO(expense.date);
      } else if (expense.created_at) {
        expenseDate = new Date(expense.created_at);
      } else {
        expenseDate = new Date();
      }
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

    // Sort expenses within each date group by time (latest first)
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].expenses.sort((a, b) => {
        const timeA = new Date(a.created_at || a.date || 0).getTime();
        const timeB = new Date(b.created_at || b.date || 0).getTime();
        return timeB - timeA; // Latest to oldest within the same date
      });
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
                <PopoverContent className="w-auto p-4" align="end">
                  {viewMode === 'custom' ? (
                    // Full date picker for custom dates
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
                  ) : viewMode === 'month' ? (
                    // Month picker for current year
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-center">{new Date().getFullYear()}</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => {
                          const monthDate = new Date(new Date().getFullYear(), i, 1);
                          const isSelected = selectedDate.getMonth() === i && selectedDate.getFullYear() === new Date().getFullYear();
                          return (
                            <Button
                              key={i}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                const newDate = new Date(new Date().getFullYear(), i, 1);
                                setSelectedDate(newDate);
                                setCalendarOpen(false);
                              }}
                            >
                              {format(monthDate, 'MMM')}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ) : viewMode === 'year' ? (
                    // Year picker (current year and previous years)
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-center">Select Year</h4>
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          const isSelected = selectedDate.getFullYear() === year;
                          return (
                            <Button
                              key={year}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                const newDate = new Date(year, 0, 1);
                                setSelectedDate(newDate);
                                setCalendarOpen(false);
                              }}
                            >
                              {year}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
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
                        {formatExpenseDate(parseISO(dateKey))}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {data.expenses.length} expense{data.expenses.length !== 1 ? 's' : ''} • {getTimezoneDisplay()}
                      </p>
                    </div>
                  </div>
                  <div className="font-semibold text-lg">
                    {formatAmount(data.total)}
                  </div>
                </div>
                
                {data.expanded && (
                  <div className="border-t overflow-x-auto">
                    <Table className="table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-2/5">Description</TableHead>
                          <TableHead className="w-1/5">Category</TableHead>
                          <TableHead className="w-1/5">Amount</TableHead>
                          <TableHead className="w-1/5">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>
                              <div className="max-w-xs lg:max-w-sm xl:max-w-md">
                                <div className="font-medium break-words">{expense.title || 'Untitled'}</div>
                                {expense.description && expense.description.trim() && (
                                  <div className="text-sm text-muted-foreground mt-1 break-words whitespace-pre-wrap">
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