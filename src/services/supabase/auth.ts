import { getSupabase } from './client';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

const redirectUri = 'almurshid://auth/callback';

export type AuthResult = {
  success: boolean;
  error?: string;
  user?: { id: string; email?: string; displayName?: string; photoUrl?: string };
};

export const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  const supabase = getSupabase();
  if (!supabase) return localAuthResponse(email);
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: 'No user returned' };
    await createProfile(supabase, data.user.id, email);
    return { success: true, user: { id: data.user.id, email: email ?? undefined } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  const supabase = getSupabase();
  if (!supabase) return localAuthResponse(email);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email ?? undefined,
        displayName: data.user.user_metadata?.display_name ?? undefined,
        photoUrl: data.user.user_metadata?.avatar_url ?? undefined,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const signInWithGoogle = async (): Promise<AuthResult> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });
    if (error) return { success: false, error: error.message };
    if (!data.url) return { success: false, error: 'No OAuth URL returned' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    if (result.type !== 'success') return { success: false, error: 'OAuth cancelled' };

    const params = extractParams(result.url);
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) return { success: false, error: sessionError.message };

    return {
      success: true,
      user: {
        id: sessionData.user?.id ?? '',
        email: sessionData.user?.email ?? undefined,
        displayName: sessionData.user?.user_metadata?.full_name ?? undefined,
        photoUrl: sessionData.user?.user_metadata?.avatar_url ?? undefined,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const signInWithApple = async (): Promise<AuthResult> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    if (Platform.OS !== 'ios') return { success: false, error: 'Apple Sign-In is only available on iOS' };
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { success: false, error: 'No identity token from Apple' };
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
    if (error) return { success: false, error: error.message };
    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email ?? undefined,
        displayName: credential.fullName
          ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim() || undefined
          : undefined,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const signOut = async (): Promise<AuthResult> => {
  const supabase = getSupabase();
  if (!supabase) return { success: true };
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const getSession = async () => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const onAuthStateChange = (callback: (session: any) => void) => {
  const supabase = getSupabase();
  if (!supabase) { callback(null); return { data: { subscription: { unsubscribe: () => {} } } }; }
  return supabase.auth.onAuthStateChange((_event: string, session: any) => callback(session));
};

async function createProfile(supabase: any, userId: string, email: string) {
  await supabase.from('profiles').upsert(
    { id: userId, email, display_name: email?.split('@')[0] ?? 'User' } as any,
    { onConflict: 'id' }
  );
}

function extractParams(url: string): { access_token: string; refresh_token: string } {
  const get = (param: string) => {
    const match = url.match(new RegExp(`[#&]${param}=([^&]+)`));
    return match ? decodeURIComponent(match[1]) : '';
  };
  return { access_token: get('access_token'), refresh_token: get('refresh_token') };
}

function localAuthResponse(email?: string): AuthResult {
  return { success: false, error: 'Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.' };
}

export function signInLocally(): AuthResult {
  const id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  return {
    success: true,
    user: { id, email: 'local@almurshid.app', displayName: 'Local User' },
  };
}
