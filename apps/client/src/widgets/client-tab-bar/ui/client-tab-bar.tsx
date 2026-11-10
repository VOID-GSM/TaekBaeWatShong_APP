import { TabBar, type TabBarItem } from '@/shared/ui';

export type ClientTabKey = 'home' | 'register' | 'pickup' | 'notifications' | 'chat';

const CLIENT_TABS: readonly TabBarItem<ClientTabKey>[] = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'register', label: '등록', icon: 'packagePlus' },
  { key: 'pickup', label: '회수', icon: 'scanBarcode' },
  // 시안의 알림 탭은 빨간 점이 붙은 아이콘(56×30) 하나로 되어 있다.
  { key: 'notifications', label: '알림', icon: 'bellBadge' },
  { key: 'chat', label: '채팅', icon: 'chat' },
];

export interface ClientTabBarProps {
  activeTab: ClientTabKey;
  onTabPress: (key: ClientTabKey) => void;
}

/**
 * 사용자 앱 하단 탭바. 아이콘 색은 시안 그대로라 활성 홈 아이콘만 흰색이다 —
 * 다른 탭이 활성화되는 시안이 나오면 아이콘 색을 상태에 따라 바꾸도록 손봐야 한다.
 */
export function ClientTabBar({ activeTab, onTabPress }: ClientTabBarProps) {
  return <TabBar items={CLIENT_TABS} activeKey={activeTab} onTabPress={onTabPress} />;
}
