import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: string;
  group_id: string;
  paid_by: string;
  groups: {
    name: string;
  };
  profiles: {
    username: string;
  };
  expense_splits: {
    amount: number;
    profiles: {
      username: string;
    };
  }[];
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          description,
          category,
          date,
          created_at,
          group_id,
          paid_by,
          groups (
            name
          ),
          profiles!expenses_paid_by_fkey (
            username
          ),
          expense_splits (
            amount,
            profiles (
              username
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setExpenses(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses
  };
};