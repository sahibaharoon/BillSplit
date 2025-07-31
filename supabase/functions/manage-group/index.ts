import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateGroupRequest {
  name: string;
  description?: string;
}

interface AddMemberRequest {
  group_id: string;
  email?: string;
  username?: string;
}

interface JoinGroupRequest {
  invite_code: string;
}

interface CreateInviteRequest {
  group_id: string;
  max_uses?: number;
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'POST' && action === 'create') {
      // Create new group
      const { name, description }: CreateGroupRequest = await req.json();

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description: description || '',
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        return new Response(JSON.stringify({ error: 'Failed to create group' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add creator as admin member
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (membershipError) {
        console.error('Error adding creator as member:', membershipError);
        await supabase.from('groups').delete().eq('id', group.id);
        return new Response(JSON.stringify({ error: 'Failed to add creator as member' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          message: 'Group created successfully',
          group
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (req.method === 'POST' && action === 'add-member') {
      // Add member to group
      const { group_id, username, email }: AddMemberRequest = await req.json();

      // Verify user is admin of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_memberships')
        .select('*')
        .eq('group_id', group_id)
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (membershipError) {
        console.error('Error checking membership:', membershipError);
        return new Response(JSON.stringify({ error: 'Error checking group permissions' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Not an admin of this group' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find user by email or username
      let targetUser;
      if (email) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', email)
          .single();
        
        if (profileError) {
          console.error('Error finding user profile:', profileError);
          return new Response(JSON.stringify({ error: 'Error finding user profile' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        targetUser = data;
      } else if (username) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', username)
          .single();
        
        if (profileError) {
          console.error('Error finding user profile:', profileError);
          return new Response(JSON.stringify({ error: 'Error finding user profile' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        targetUser = data;
      }

      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add user to group
      const { error: addError } = await supabase
        .from('group_memberships')
        .insert({
          group_id,
          user_id: targetUser.user_id,
          role: 'member'
        });

      if (addError) {
        if (addError.code === '23505') {
          return new Response(JSON.stringify({ error: 'User is already a member of this group' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('Error adding member:', addError);
        return new Response(JSON.stringify({ error: 'Failed to add member' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ message: 'Member added successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (req.method === 'POST' && action === 'create-invite') {
      // Create invite link
      const { group_id, max_uses }: CreateInviteRequest = await req.json();

      // Verify user is admin
      const { data: membership } = await supabase
        .from('group_memberships')
        .select('*')
        .eq('group_id', group_id)
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Not an admin of this group' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate unique invite code
      const inviteCode = crypto.randomUUID();
      
      const { data: invite, error: inviteError } = await supabase
        .from('group_invites')
        .insert({
          group_id,
          created_by: user.id,
          max_uses: max_uses || null,
          invite_code: inviteCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (inviteError) {
        return new Response(JSON.stringify({ error: 'Failed to create invite' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ invite }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'POST' && action === 'join') {
      // Join group via invite code
      const { invite_code }: JoinGroupRequest = await req.json();

      const { data: invite } = await supabase
        .from('group_invites')
        .select('*')
        .eq('invite_code', invite_code)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!invite || (invite.max_uses && invite.current_uses >= invite.max_uses)) {
        return new Response(JSON.stringify({ error: 'Invalid or expired invite' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add user to group
      const { error: addError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: invite.group_id,
          user_id: user.id,
          role: 'member'
        });

      if (addError) {
        if (addError.code === '23505') {
          return new Response(JSON.stringify({ error: 'Already a member of this group' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ error: 'Failed to join group' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update invite usage
      await supabase
        .from('group_invites')
        .update({ current_uses: invite.current_uses + 1 })
        .eq('id', invite.id);

      return new Response(
        JSON.stringify({ message: 'Successfully joined group' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'DELETE') {
      // Remove member from group or delete group
      const group_id = url.searchParams.get('group_id');
      const member_user_id = url.searchParams.get('member_user_id');

      if (!group_id) {
        return new Response(JSON.stringify({ error: 'group_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user is admin of the group
      const { data: membership } = await supabase
        .from('group_memberships')
        .select('*')
        .eq('group_id', group_id)
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Not an admin of this group' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (member_user_id) {
        // Remove specific member
        const { error: removeError } = await supabase
          .from('group_memberships')
          .delete()
          .eq('group_id', group_id)
          .eq('user_id', member_user_id);

        if (removeError) {
          console.error('Error removing member:', removeError);
          return new Response(JSON.stringify({ error: 'Failed to remove member' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({ message: 'Member removed successfully' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Delete entire group
        const { error: deleteError } = await supabase
          .from('groups')
          .delete()
          .eq('id', group_id);

        if (deleteError) {
          console.error('Error deleting group:', deleteError);
          return new Response(JSON.stringify({ error: 'Failed to delete group' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({ message: 'Group deleted successfully' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in manage-group function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});