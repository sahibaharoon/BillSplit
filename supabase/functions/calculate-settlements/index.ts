import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Balance {
  user_id: string;
  balance: number;
  username: string;
}

interface Settlement {
  from_user: string;
  to_user: string;
  amount: number;
  from_username: string;
  to_username: string;
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

    const { group_id } = await req.json();

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

    // Get all expenses and splits for the group
    const { data: expenses } = await supabase
      .from('expenses')
      .select(`
        id,
        amount,
        paid_by,
        expense_splits (
          user_id,
          amount
        )
      `)
      .eq('group_id', group_id);

    // Get all group members
    const { data: members } = await supabase
      .from('group_memberships')
      .select(`
        user_id,
        profiles (
          username
        )
      `)
      .eq('group_id', group_id);

    if (!expenses || !members) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate balances for each user
    const balances: Record<string, Balance> = {};
    
    // Initialize balances
    members.forEach(member => {
      balances[member.user_id] = {
        user_id: member.user_id,
        balance: 0,
        username: member.profiles?.username || 'Unknown'
      };
    });

    // Process each expense
    expenses.forEach(expense => {
      // Add paid amount to payer's balance
      if (balances[expense.paid_by]) {
        balances[expense.paid_by].balance += parseFloat(expense.amount.toString());
      }

      // Subtract split amounts from each participant
      expense.expense_splits.forEach(split => {
        if (balances[split.user_id]) {
          balances[split.user_id].balance -= parseFloat(split.amount.toString());
        }
      });
    });

    // Calculate minimum settlements using greedy algorithm
    const settlements: Settlement[] = [];
    const balanceArray = Object.values(balances).filter(b => Math.abs(b.balance) > 0.01);
    
    while (balanceArray.length > 1) {
      // Sort by balance - debtors first (negative), then creditors (positive)
      balanceArray.sort((a, b) => a.balance - b.balance);
      
      const debtor = balanceArray[0]; // Most negative balance
      const creditor = balanceArray[balanceArray.length - 1]; // Most positive balance
      
      if (debtor.balance >= -0.01 || creditor.balance <= 0.01) break;
      
      const settlementAmount = Math.min(-debtor.balance, creditor.balance);
      
      settlements.push({
        from_user: debtor.user_id,
        to_user: creditor.user_id,
        amount: parseFloat(settlementAmount.toFixed(2)),
        from_username: debtor.username,
        to_username: creditor.username
      });
      
      debtor.balance += settlementAmount;
      creditor.balance -= settlementAmount;
      
      // Remove users with zero balance
      if (Math.abs(debtor.balance) <= 0.01) {
        balanceArray.splice(0, 1);
      }
      if (Math.abs(creditor.balance) <= 0.01) {
        balanceArray.splice(balanceArray.length - 1, 1);
      }
    }

    return new Response(
      JSON.stringify({
        balances: Object.values(balances),
        settlements,
        total_transactions: settlements.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error calculating settlements:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});