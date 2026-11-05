import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { bellXml } from '@/shared/assets/bell';
import { chatXml } from '@/shared/assets/chat';
import { homeXml } from '@/shared/assets/home';
import { packagePlusXml } from '@/shared/assets/package-plus';
import { scanBarcodeXml } from '@/shared/assets/scan-barcode';
import { MainTabBar, MainTabButton } from '@/widgets/main-tab-bar';

export default function TabsLayout() {
  // TODO: 알림 API 가 생기면 읽지 않은 알림 여부로 바꾼다.
  const hasUnreadNotifications = false;

  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot />
      <TabList asChild>
        <MainTabBar>
          <TabTrigger name="index" href="/" asChild>
            <MainTabButton icon={homeXml} label="홈" />
          </TabTrigger>
          <TabTrigger name="register" href="/register" asChild>
            <MainTabButton icon={packagePlusXml} label="택배 등록" />
          </TabTrigger>
          <TabTrigger name="pickup" href="/pickup" asChild>
            <MainTabButton icon={scanBarcodeXml} label="택배 회수" />
          </TabTrigger>
          <TabTrigger name="notifications" href="/notifications" asChild>
            <MainTabButton icon={bellXml} label="알림" showDot={hasUnreadNotifications} />
          </TabTrigger>
          {/* 채팅 화면이 머지되면 탭이 아닌 스택 화면(/chat)으로 연결한다. */}
          <MainTabButton icon={chatXml} label="채팅" disabled />
        </MainTabBar>
      </TabList>
    </Tabs>
  );
}
