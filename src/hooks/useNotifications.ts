import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface NotificationOptions {
  type: string;
  title: string;
  message: string;
  relatedExpenseId?: string;
  relatedData?: any;
  deliveryChannels?: ('email' | 'push' | 'sms')[];
}

export function useNotifications() {
  const { user } = useAuth();

  const sendNotification = async (options: NotificationOptions) => {
    if (!user?.id) {
      console.warn('Cannot send notification: User not authenticated');
      return;
    }

    const {
      type,
      title,
      message,
      relatedExpenseId,
      relatedData = {},
      deliveryChannels = ['email', 'push']
    } = options;

    console.log('🔔 Sending notification:', { type, title, user_id: user.id });

    try {
      // Send notification through each requested channel
      for (const channel of deliveryChannels) {
        const { data, error } = await supabase.functions.invoke('send-notification', {
          body: {
            user_id: user.id,
            notification_type: type,
            title,
            message,
            delivery_channel: channel,
            related_expense_id: relatedExpenseId,
            related_data: relatedData
          }
        });

        if (error) {
          console.error(`❌ Failed to send ${channel} notification:`, error);
        } else {
          console.log(`✅ ${channel} notification sent:`, data);
        }
      }
    } catch (error) {
      console.error('❌ Notification service error:', error);
    }
  };

  // Specific notification helpers
  const notifyExpenseAdded = async (expense: any) => {
    await sendNotification({
      type: 'expense_alert',
      title: 'New Expense Added',
      message: `${expense.title || 'Untitled expense'}: ${expense.amount ? `$${expense.amount.toFixed(2)}` : 'Amount not specified'}`,
      relatedExpenseId: expense.id,
      relatedData: { expense }
    });
  };

  const notifyLargeExpense = async (expense: any, threshold = 500) => {
    if (expense.amount >= threshold) {
      await sendNotification({
        type: 'large_expense',
        title: 'Large Expense Alert',
        message: `High-value expense detected: ${expense.title || 'Untitled'} for $${expense.amount.toFixed(2)}`,
        relatedExpenseId: expense.id,
        relatedData: { expense, threshold }
      });
    }
  };

  const notifyDuplicateExpense = async (expense: any, similarExpenses: any[]) => {
    await sendNotification({
      type: 'duplicate_expense',
      title: 'Potential Duplicate Expense',
      message: `Similar expense detected: ${expense.title || 'Untitled'} - $${expense.amount?.toFixed(2) || '0.00'}. Found ${similarExpenses.length} similar expenses.`,
      relatedExpenseId: expense.id,
      relatedData: { expense, similarExpenses }
    });
  };

  const notifyReceiptProcessed = async (expense: any, processingResult: any) => {
    await sendNotification({
      type: 'receipt_processing',
      title: 'Receipt Processed Successfully',
      message: `Receipt for ${expense.title || 'expense'} has been processed and categorized as ${expense.category}`,
      relatedExpenseId: expense.id,
      relatedData: { expense, processingResult }
    });
  };

  const notifyBudgetWarning = async (category: string, spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    await sendNotification({
      type: 'budget_warning',
      title: 'Budget Alert',
      message: `You've spent ${percentage.toFixed(0)}% of your ${category} budget ($${spent.toFixed(2)} of $${budget.toFixed(2)})`,
      relatedData: { category, spent, budget, percentage }
    });
  };

  const notifyAIInsight = async (insight: any) => {
    await sendNotification({
      type: 'ai_insight',
      title: 'AI Business Insight',
      message: insight.summary || 'New business insights are available for review',
      relatedData: { insight }
    });
  };

  const notifyDataExportComplete = async (exportType: string, fileName: string) => {
    await sendNotification({
      type: 'data_export',
      title: 'Data Export Complete',
      message: `Your ${exportType} export (${fileName}) is ready for download`,
      relatedData: { exportType, fileName }
    });
  };

  const notifyAccountChange = async (changeType: string, details: any) => {
    await sendNotification({
      type: 'account_change',
      title: 'Account Update',
      message: `Your account ${changeType} has been updated successfully`,
      relatedData: { changeType, details }
    });
  };

  const notifyLoginAlert = async (loginInfo: any) => {
    await sendNotification({
      type: 'login_alert',
      title: 'New Login Detected',
      message: `New login from ${loginInfo.location || 'unknown location'} on ${loginInfo.device || 'unknown device'}`,
      relatedData: { loginInfo }
    });
  };

  return {
    sendNotification,
    notifyExpenseAdded,
    notifyLargeExpense,
    notifyDuplicateExpense,
    notifyReceiptProcessed,
    notifyBudgetWarning,
    notifyAIInsight,
    notifyDataExportComplete,
    notifyAccountChange,
    notifyLoginAlert
  };
}