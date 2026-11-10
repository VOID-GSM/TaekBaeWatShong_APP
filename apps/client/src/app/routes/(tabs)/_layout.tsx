import { type BottomTabBarProps, Tabs } from 'expo-router/js-tabs';

import { ClientTabBar, type ClientTabKey } from '@/widgets/client-tab-bar';

/** 라우트 이름 → 탭. 구역 화면(zone)은 홈 탭 아래 화면이라 홈이 활성으로 보인다. */
const ROUTE_TAB: Record<string, ClientTabKey> = { index: 'home', zone: 'home' };
/** 아직 화면이 없는 탭(등록·회수·알림·채팅)은 라우트가 생기면 여기에 추가한다. */
const TAB_ROUTE: Partial<Record<ClientTabKey, string>> = { home: 'index' };

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const routeName = state.routes[state.index]?.name ?? 'index';

  return (
    <ClientTabBar
      activeTab={ROUTE_TAB[routeName] ?? 'home'}
      onTabPress={(key) => {
        const target = state.routes.find((route) => route.name === TAB_ROUTE[key]);
        if (target !== undefined) {
          navigateToTab(target.key);
        }
      }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="zone" options={{ href: null }} />
    </Tabs>
  );
}
