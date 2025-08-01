import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const body = await req.json();
  const { action, group_name, group_id, email, username, user_id } = body;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Missing auth header", { status: 401 });
  }

  const jwt = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const findUserId = async () => {
    if (user_id) return user_id;
    if (email) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();
      if (error || !data) throw new Error("User not found by email");
      return data.user_id;
    } else if (username) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .single();
      if (error || !data) throw new Error("User not found by username");
      return data.user_id;
    }
    throw new Error("No identifier provided");
  };

  try {
    if (action === "create") {
      const { data, error } = await supabase
        .from("groups")
        .insert({ name: group_name, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      const { error: memberError } = await supabase
        .from("group_memberships")
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'member'
        });

      if (memberError) {
        await supabase.from("groups").delete().eq("id", data.id);
        throw memberError;
      }

      return new Response(JSON.stringify({ group: data }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "add-member") {
      const targetUserId = await findUserId();

      // Check if the current user is a member of the group
      const { data: currentMembership, error: membershipCheckError } = await supabase
        .from("group_memberships")
        .select("*")
        .eq("group_id", group_id)
        .eq("user_id", user.id)
        .single();

      if (membershipCheckError || !currentMembership) {
        return new Response("Only group members can add others", {
          status: 403,
        });
      }

      // Check if target user is already a member
      const { data: existingMembership } = await supabase
        .from("group_memberships")
        .select("*")
        .eq("group_id", group_id)
        .eq("user_id", targetUserId)
        .single();

      if (existingMembership) {
        return new Response("User already in group", { status: 400 });
      }

      // Add the target user to the group
      const { error } = await supabase
        .from("group_memberships")
        .insert({ 
          group_id, 
          user_id: targetUserId,
          role: 'member' // Add role field if your table has it
        });

      if (error) {
        console.error("Error adding member:", error);
        return new Response("Failed to add member: " + error.message, { status: 500 });
      }

      return new Response("Member added", { status: 200 });
    }

    if (action === "remove-member") {
      const targetUserId = await findUserId();

      const { count, error: membershipCheckError } = await supabase
        .from("group_memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group_id)
        .eq("user_id", user.id);

      if (membershipCheckError || count === 0) {
        return new Response("Only group members can remove others", {
          status: 403,
        });
      }

      const { error } = await supabase
        .from("group_memberships")
        .delete()
        .eq("group_id", group_id)
        .eq("user_id", targetUserId);

      if (error) throw error;
      return new Response("Member removed", { status: 200 });
    }

    if (action === "create-invite") {
      const { count, error: membershipCheckError } = await supabase
        .from("group_memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group_id)
        .eq("user_id", user.id);

      if (membershipCheckError || count === 0) {
        return new Response("Only group members can create invites", {
          status: 403,
        });
      }

      const token = crypto.randomUUID();

      const { data, error } = await supabase
        .from("invite_links")
        .insert({
          token,
          group_id,
          created_by: user.id,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
          max_uses: 5,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ invite: data }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Invalid action", { status: 400 });
  } catch (err) {
    console.error(err);
    return new Response("Server error: " + (err as Error).message, {
      status: 500,
    });
  }
});