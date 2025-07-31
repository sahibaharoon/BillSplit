import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Balance {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
}

export const useBalance = () => {
  const [balance, setBalance] = useState<Balance>({
    totalOwed: 0,
    totalOwing: 0,
    netBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const calculateBalance = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all groups user is part of
      const { data: groups } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', user.id);

      if (!groups?.length) {
        setBalance({ totalOwed: 0, totalOwing: 0, netBalance: 0 });
        return;
      }

      let totalOwed = 0;
      let totalOwing = 0;

      // Calculate balance for each group
      for (const group of groups) {
        try {
          const { data, error } = await supabase.functions.invoke('calculate-settlements', {
            body: { group_id: group.group_id }
          });

          if (error) continue;

          const userBalance = data.balances?.find((b: any) => b.user_id === user.id);
          if (userBalance) {
            if (userBalance.balance > 0) {
              totalOwed += userBalance.balance;
            } else if (userBalance.balance < 0) {
              totalOwing += Math.abs(userBalance.balance);
            }
          }
        } catch (error) {
          console.error('Error calculating balance for group:', group.group_id, error);
        }
      }

      setBalance({
        totalOwed,
        totalOwing,
        netBalance: totalOwed - totalOwing
      });
    } catch (error) {
      console.error('Error calculating balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateBalance();
  }, [user]);

  return {
    balance,
    loading,
    refetch: calculateBalance
  };
};