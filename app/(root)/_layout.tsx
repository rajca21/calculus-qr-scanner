import { useCallback, useEffect, useRef, useState } from 'react';
import { Redirect, Slot } from 'expo-router';
import {
  ConnectionChecks,
  ConnectionLoadingScreen,
  ConnectionErrorScreen,
  INITIAL_CHECKS,
} from '@/components/connection/ConnectionScreens';

import { useGlobalContext } from '@/lib/global-provider';
import {
  getLocalStorage,
  removeLocalStorage,
  setLocalStorage,
} from '@/lib/localAsyncStorage';
import {
  getDateTimeDBServer,
  getDateTimeWebServer,
} from '@/lib/calculusWS/serviceInfoRequests';
import {
  validateSession,
  getUserById,
} from '@/lib/calculusWS/auhtenticationServices';

export default function AppLayout() {
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [checks, setChecks] = useState<ConnectionChecks>(INITIAL_CHECKS);
  const currentRun = useRef(0);

  const { loading, isLoggedIn, setLoading, setIsLoggedIn, setUser } =
    useGlobalContext();

  const logoutLocal = useCallback(async () => {
    await removeLocalStorage();
    setUser(null);
    setIsLoggedIn(false);
  }, [setUser, setIsLoggedIn]);

  const bootstrapAuth = useCallback(async () => {
    const userInfo = await getLocalStorage('userDetails');

    if (!userInfo) {
      await logoutLocal();
      return;
    }

    const uid = userInfo?.uid;
    const token = userInfo?.sessionToken;

    if (!uid || !token) {
      await logoutLocal();
      return;
    }

    const ok = await validateSession(String(uid), String(token));
    if (!ok) {
      await logoutLocal();
      return;
    }

    setUser({ ...userInfo });
    setIsLoggedIn(true);

    const hydrate = async () => {
      try {
        const fresh = await getUserById(String(uid), userInfo?.email || '');
        if (fresh) {
          setUser(fresh);
          await setLocalStorage('userDetails', fresh);
        }
      } catch {}
    };

    void hydrate();
  }, [logoutLocal, setUser, setIsLoggedIn]);

  const initialize = useCallback(async () => {
    const run = ++currentRun.current;
    const isCurrent = () => run === currentRun.current;
    setLoading(true);
    setApiReady(null);
    setChecks({ ...INITIAL_CHECKS });

    try {
      // Keep the independent network checks parallel. Each status updates
      // when its actual request completes, rather than on a cosmetic timer.
      const [webReady, dbReady] = await Promise.all([
        getDateTimeWebServer().then((ready) => {
          if (isCurrent()) setChecks((previous) => ({ ...previous, server: ready ? 'success' : 'error' }));
          return ready;
        }),
        getDateTimeDBServer().then((ready) => {
          if (isCurrent()) setChecks((previous) => ({ ...previous, database: ready ? 'success' : 'error' }));
          return ready;
        }),
      ]);

      if (!isCurrent()) return;
      if (webReady && dbReady) {
        setChecks((previous) => ({ ...previous, account: 'checking' }));
        await bootstrapAuth();
        if (!isCurrent()) return;
        setChecks((previous) => ({ ...previous, account: 'success' }));
        setApiReady(true);
      } else {
        setApiReady(false);
      }
    } catch {
      if (isCurrent()) {
        setChecks((previous) => ({ ...previous, account: 'error' }));
        setApiReady(false);
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [bootstrapAuth, setLoading]);

  useEffect(() => {
    const timer = setTimeout(() => { void initialize(); }, 0);
    return () => { clearTimeout(timer); currentRun.current += 1; };
  }, [initialize]);

  if (loading || apiReady === null) {
    return <ConnectionLoadingScreen checks={checks} />;
  }

  if (apiReady === false) {
    return <ConnectionErrorScreen checks={checks} onRetry={() => { void initialize(); }} />;
  }

  if (!isLoggedIn) return <Redirect href='/sign-in' />;

  return <Slot />;
}
