import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  profile?: {
    username: string;
    email: string;
    full_name?: string;
  };
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get accepted friends with simpler query  
      const { data: friendsData } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      // Get pending requests sent to me
      const { data: requestsData } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Get profiles for friends
      const friendIds = (friendsData || []).map(f => f.friend_id);
      const requestIds = (requestsData || []).map(r => r.user_id);
      
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('user_id, username, email, full_name')
        .in('user_id', [...friendIds, ...requestIds]);

      // Map with profiles
      const mappedFriends = (friendsData || []).map(friend => ({
        ...friend,
        status: friend.status as 'pending' | 'accepted' | 'blocked',
        profile: friendProfiles?.find(p => p.user_id === friend.friend_id)
      }));

      const mappedRequests = (requestsData || []).map(request => ({
        ...request,
        status: request.status as 'pending' | 'accepted' | 'blocked',
        profile: friendProfiles?.find(p => p.user_id === request.user_id)
      }));

      setFriends(mappedFriends);
      setRequests(mappedRequests);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (email: string) => {
    if (!user) return false;

    try {
      // Check if user is trying to add themselves
      if (email.toLowerCase() === user.email?.toLowerCase()) {
        throw new Error('You cannot add yourself as a friend');
      }

      // Find user by email
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (!targetUser) {
        throw new Error('User not found');
      }

      // Check if friendship already exists
      const { data: existingFriend } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUser.user_id}),and(user_id.eq.${targetUser.user_id},friend_id.eq.${user.id})`)
        .single();

      if (existingFriend) {
        throw new Error('Friend request already exists or you are already friends');
      }

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: targetUser.user_id,
          status: 'pending'
        });

      if (error) throw error;
      
      // Send notification email
      try {
        await supabase.functions.invoke('send-friend-email', {
          body: {
            recipientEmail: email,
            senderName: user?.user_metadata?.full_name || user?.email || 'Someone',
            senderEmail: user?.email || ''
          }
        });
      } catch (emailError) {
        console.error('Error sending friend request email:', emailError);
      }
      
      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      const status = accept ? 'accepted' : 'blocked';
      
      const { error } = await supabase
        .from('friends')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      // If accepted, create reverse friendship
      if (accept) {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from('friends')
            .insert({
              user_id: request.friend_id,
              friend_id: request.user_id,
              status: 'accepted'
            });
        }
      }

      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error responding to request:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  return {
    friends,
    requests,
    loading,
    sendFriendRequest,
    respondToRequest,
    refetch: fetchFriends
  };
};