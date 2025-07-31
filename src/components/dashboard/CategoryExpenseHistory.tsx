import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronDown, ChevronRight, Tag, Edit3, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
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

interface CategoryExpenseHistoryProps {
  category: string;
  expenses: Expense[];
  onBack: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

interface GroupedExpenses {
  [date: string]: {
    expenses: Expense[];
    total: number;
    expanded: boolean;
  };
}

export function CategoryExpenseHistory({ 
  category, 
  expenses, 
  onBack, 
  onEdit, 
  onDelete 
}: CategoryExpenseHistoryProps) {
  const { formatAmount } = useCurrency();
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Filter expenses for this category
  const categoryExpenses = useMemo(() => {
    const categoryKey = category.toLowerCase().replace(/ & | /g, '');
    // Match expenses by both the full category name and the key format
    return expenses.filter(expense => 
      expense.category === categoryKey || 
      expense.category === category ||
      expense.category?.toLowerCase() === category.toLowerCase()
    );
  }, [expenses, category]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const grouped: GroupedExpenses = {};
    
    categoryExpenses.forEach(expense => {
      const expenseDate = expense.date ? parseISO(expense.date) : (expense.created_at ? new Date(expense.created_at) : new Date());
      const dateKey = format(expenseDate, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          expenses: [],
          total: 0,
          expanded: expandedDates.has(dateKey)
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
  }, [categoryExpenses, expandedDates]);

  // Calculate totals
  const totalAmount = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalCount = categoryExpenses.length;

  const toggleDateExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {category} Expenses
              </CardTitle>
              <CardDescription>
                {totalCount > 0 
                  ? `${totalCount} expenses • ${formatAmount(totalAmount)} total`
                  : 'No expenses found in this category'
                }
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedExpenses).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No expenses found</p>
            <p className="text-sm">No expenses logged in the {category} category</p>
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
                          <TableHead>Amount</TableHead>
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