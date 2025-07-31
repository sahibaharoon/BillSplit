import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  member_count: number;
  role: string;
}

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          created_at,
          created_by,
          group_memberships!inner (
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            member_count: count || 0,
            role: group.group_memberships[0]?.role || 'member'
          };
        })
      );

      setGroups(groupsWithCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups
  };
};