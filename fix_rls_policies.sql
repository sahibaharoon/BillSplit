-- Fix RLS policies to avoid infinite recursion
-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view memberships for their groups" ON public.group_memberships;
DROP POLICY IF EXISTS "Group creators can add members" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON public.group_memberships;
DROP POLICY IF EXISTS "Members can add others to their groups" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can delete their own membership" ON public.group_memberships;

DROP POLICY IF EXISTS "Anyone can create a group" ON public.groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups they created or belong to" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON public.groups;

-- Create simple, non-recursive policies for groups
CREATE POLICY "Users can view groups they created" ON public.groups FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create groups" ON public.groups FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update groups they created" ON public.groups FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete groups they created" ON public.groups FOR DELETE 
USING (created_by = auth.uid());

-- Create simple, non-recursive policies for group_memberships
CREATE POLICY "Users can view their own memberships" ON public.group_memberships FOR SELECT 
USING (user_id = auth.uid());

-- Allow any authenticated user to add members to any group
CREATE POLICY "Allow adding members" ON public.group_memberships FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own memberships" ON public.group_memberships FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can remove themselves from groups" ON public.group_memberships FOR DELETE 
USING (user_id = auth.uid());

-- For expenses (if needed)
DROP POLICY IF EXISTS "Users can view expenses for groups they belong to" ON public.expenses;
DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expense creators can update their expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expense creators can delete their expenses" ON public.expenses;

CREATE POLICY "Users can view expenses they paid for" ON public.expenses FOR SELECT 
USING (paid_by = auth.uid());

CREATE POLICY "Users can create expenses" ON public.expenses FOR INSERT 
WITH CHECK (auth.uid() = paid_by);

CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE 
USING (auth.uid() = paid_by);

CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE 
USING (auth.uid() = paid_by); 