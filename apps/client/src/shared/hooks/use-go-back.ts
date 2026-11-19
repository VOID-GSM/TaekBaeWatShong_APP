import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** 스택 화면의 뒤로가기. 딥링크 등으로 바로 들어와 뒤로 갈 화면이 없으면 홈으로 보낸다. */
export function useGoBack(): () => void {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);
}
