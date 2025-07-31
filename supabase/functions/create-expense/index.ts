import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateExpenseRequest {
  group_id: string;
  amount: number;
  description: string;
  category?: string;
  date?: string;
  splits: {
    user_id: string;
    amount: number;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: CreateExpenseRequest = await req.json();
    const { group_id, amount, description, category, date, splits } = requestData;

    // Verify user is member of the group
    const { data: membership } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Not a member of this group' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate splits sum equals total amount
    const totalSplits = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplits - amount) > 0.01) {
      return new Response(JSON.stringify({ error: 'Splits do not equal total amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        group_id,
        paid_by: user.id,
        amount,
        description,
        category: category || 'general',
        date: date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      return new Response(JSON.stringify({ error: 'Failed to create expense' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the expense splits
    const splitsWithExpenseId = splits.map(split => ({
      expense_id: expense.id,
      user_id: split.user_id,
      amount: split.amount
    }));

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitsWithExpenseId);

    if (splitsError) {
      console.error('Error creating expense splits:', splitsError);
      // Rollback the expense if splits failed
      await supabase.from('expenses').delete().eq('id', expense.id);
      return new Response(JSON.stringify({ error: 'Failed to create expense splits' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the complete expense with splits
    const { data: completeExpense } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_splits (
          *,
          profiles (
            username
          )
        ),
        profiles!expenses_paid_by_fkey (
          username
        )
      `)
      .eq('id', expense.id)
      .single();

    return new Response(
      JSON.stringify({
        message: 'Expense created successfully',
        expense: completeExpense
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-expense function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});