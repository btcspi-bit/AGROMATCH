import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { defaultUserProfile } from "@/data/defaults";
import { supabase } from "@/lib/supabase";

import {
  loadOrCreateProfile as loadOrCreateProfileService,
  saveProfile as saveProfileService,
} from "@/services/profiles";

import type { UserProfile } from "@/types";

export function useAuthProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] =
    useState<UserProfile>(defaultUserProfile);

  const lastLoadedUserIdRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (currentUser: User) => {
    try {
      if (lastLoadedUserIdRef.current === currentUser.id) {
        return null;
      }

      lastLoadedUserIdRef.current = currentUser.id;

      const profile = await loadOrCreateProfileService(currentUser);

      setUserProfile(profile);

      return profile;
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);

      lastLoadedUserIdRef.current = null;

      alert("Não foi possível carregar seu perfil agora.");

      return null;
    }
  }, []);

  const loadInitialSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Erro ao buscar sessão:", error);
      return;
    }

    const sessionUser = data.session?.user ?? null;

    setUser(sessionUser);

    if (sessionUser) {
      await loadProfile(sessionUser);
    } else {
      lastLoadedUserIdRef.current = null;
      setUserProfile(defaultUserProfile);
    }
  }, [loadProfile]);

  useEffect(() => {
    loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;

      setUser(sessionUser);

      if (sessionUser) {
        await loadProfile(sessionUser);
      } else {
        lastLoadedUserIdRef.current = null;
        setUserProfile(defaultUserProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadInitialSession, loadProfile]);

  const saveProfile = useCallback(
    async (updatedProfile: UserProfile) => {
      if (!user) {
        alert("Entre na sua conta para editar o perfil.");
        return false;
      }

      try {
        await saveProfileService(user.id, updatedProfile);

        setUserProfile(updatedProfile);

        alert("Perfil atualizado com sucesso.");

        return true;
      } catch (error: any) {
        console.error("Erro ao salvar perfil:", error);

        alert("Não foi possível salvar seu perfil agora.");

        return false;
      }
    },
    [user]
  );

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      lastLoadedUserIdRef.current = null;
      setUser(null);
      setUserProfile(defaultUserProfile);

      return true;
    } catch (error: any) {
      console.error("Erro ao sair da conta:", error);

      alert("Não foi possível sair da conta agora.");

      return false;
    }
  }, []);

  const reloadProfile = useCallback(async () => {
    if (!user) return null;

    lastLoadedUserIdRef.current = null;

    return loadProfile(user);
  }, [user, loadProfile]);

  return {
    user,
    userProfile,
    setUserProfile,
    saveProfile,
    logout,
    reloadProfile: user ? reloadProfile : undefined,
  };
}