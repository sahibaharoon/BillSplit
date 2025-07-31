-- Fix infinite recursion in group_memberships policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view memberships for their groups" ON public.group_memberships;
DROP POLICY IF EXISTS "Group admins can manage memberships" ON public.group_memberships;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own memberships" ON public.group_memberships FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships" ON public.group_memberships FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own memberships" ON public.group_memberships FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own memberships" ON public.group_memberships FOR DELETE 
USING (user_id = auth.uid());

-- Also fix the groups policies to avoid potential recursion
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can delete groups" ON public.groups;

-- Create simpler groups policies
CREATE POLICY "Users can view groups they created" ON public.groups FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can update groups they created" ON public.groups FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete groups they created" ON public.groups FOR DELETE 
USING (created_by = auth.uid()); 