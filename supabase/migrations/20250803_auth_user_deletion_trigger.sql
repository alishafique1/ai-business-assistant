-- Create a function to delete auth user when profile is deleted
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_deletion()
RETURNS TRIGGER AS $$
DECLARE
  result RECORD;
BEGIN
  -- Log the deletion attempt
  RAISE LOG 'Attempting to delete auth user for user_id: %', OLD.user_id;
  
  -- Use the auth.admin_delete_user function if available
  -- This requires the trigger to be executed with elevated privileges
  BEGIN
    -- Delete the auth user
    SELECT auth.admin_delete_user(OLD.user_id) INTO result;
    RAISE LOG 'Successfully deleted auth user: %', OLD.user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Failed to delete auth user %: %', OLD.user_id, SQLERRM;
  END;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table to delete auth user when profile is deleted
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_deletion ON public.profiles;
CREATE TRIGGER trigger_delete_auth_user_on_profile_deletion
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_auth_user_on_profile_deletion();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.delete_auth_user_on_profile_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_auth_user_on_profile_deletion() TO service_role;

-- Add a stored procedure for complete account deletion that can be called from client
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  deletion_results JSON := '[]'::JSON;
  table_result JSON;
  table_name TEXT;
  deleted_count INTEGER;
BEGIN
  -- Verify the requesting user matches the target user (security check)
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete another user''s account';
  END IF;

  -- Delete from all user tables in dependency order
  FOR table_name IN VALUES 
    ('messages'),
    ('conversations'),
    ('business_expenses'),
    ('business_outcomes'), 
    ('client_metrics'),
    ('expenses'),
    ('knowledge_base_entries'),
    ('clients'),
    ('integrations'),
    ('ai_settings'),
    ('profiles') -- This will trigger auth user deletion
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM %I WHERE user_id = $1', table_name) USING target_user_id;
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
      table_result := json_build_object(
        'table', table_name,
        'status', 'success',
        'deleted_rows', deleted_count
      );
      
      deletion_results := deletion_results || table_result::jsonb;
      
    EXCEPTION WHEN OTHERS THEN
      table_result := json_build_object(
        'table', table_name,
        'status', 'error',
        'error', SQLERRM
      );
      deletion_results := deletion_results || table_result::jsonb;
    END;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Account deletion completed',
    'deletion_results', deletion_results
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'deletion_results', deletion_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (they can only delete their own account)
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;

-- Create a direct auth user deletion function for the edge function
CREATE OR REPLACE FUNCTION public.delete_auth_user_direct(target_user_id UUID)
RETURNS JSON AS $$
BEGIN
  -- This function should only be called by service role (edge functions)
  -- Delete directly from auth.users table
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Also delete from auth.identities if it exists
  DELETE FROM auth.identities WHERE user_id = target_user_id;
  
  -- Delete from auth.sessions
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  
  -- Delete from auth.refresh_tokens  
  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Auth user deleted successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role only (for edge functions)
GRANT EXECUTE ON FUNCTION public.delete_auth_user_direct(UUID) TO service_role;

-- Update the main delete_user_account function to also delete auth user properly
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  deletion_results JSON := '[]'::JSON;
  table_result JSON;
  table_name TEXT;
  deleted_count INTEGER;
BEGIN
  -- Verify the requesting user matches the target user (security check)
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete another user''s account';
  END IF;

  -- Delete from all user tables in dependency order
  FOR table_name IN VALUES 
    ('messages'),
    ('conversations'),
    ('business_expenses'),
    ('business_outcomes'), 
    ('client_metrics'),
    ('expenses'),
    ('knowledge_base_entries'),
    ('clients'),
    ('integrations'),
    ('ai_settings'),
    ('profiles') -- This will trigger auth user deletion via trigger
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM %I WHERE user_id = $1', table_name) USING target_user_id;
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
      table_result := json_build_object(
        'table', table_name,
        'status', 'success',
        'deleted_rows', deleted_count
      );
      
      deletion_results := deletion_results || table_result::jsonb;
      
    EXCEPTION WHEN OTHERS THEN
      table_result := json_build_object(
        'table', table_name,
        'status', 'error',
        'error', SQLERRM
      );
      deletion_results := deletion_results || table_result::jsonb;
    END;
  END LOOP;

  -- Now explicitly delete from auth tables as final step
  BEGIN
    -- Delete from auth tables directly
    DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    DELETE FROM auth.identities WHERE user_id = target_user_id;  
    DELETE FROM auth.users WHERE id = target_user_id;
    
    table_result := json_build_object(
      'table', 'auth_deletion',
      'status', 'success',
      'deleted_rows', 1
    );
    deletion_results := deletion_results || table_result::jsonb;
    
  EXCEPTION WHEN OTHERS THEN
    table_result := json_build_object(
      'table', 'auth_deletion',
      'status', 'error', 
      'error', SQLERRM
    );
    deletion_results := deletion_results || table_result::jsonb;
  END;

  RETURN json_build_object(
    'success', true,
    'message', 'Account deletion completed',
    'deletion_results', deletion_results
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'deletion_results', deletion_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;