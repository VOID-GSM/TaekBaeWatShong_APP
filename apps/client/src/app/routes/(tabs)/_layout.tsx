import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { bellPillXml } from '@/shared/assets/bell-pill';
import { chatXml } from '@/shared/assets/chat';
import { homeXml } from '@/shared/assets/home';
import { packagePlusXml } from '@/shared/assets/package-plus';
import { scanBarcodeXml } from '@/shared/assets/scan-barcode';
import { size } from '@/shared/ui';
import { MainTabBar, MainTabButton } from '@/widgets/main-tab-bar';

export default function TabsLayout() {
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
            {/* 알림 SVG 는 새 알림 점까지 알약 크기로 그려져 있다. */}
            <MainTabButton
              icon={bellPillXml}
              label="알림"
              iconWidth={size.tabPillWidth}
              iconHeight={size.tabPillHeight}
            />
          </TabTrigger>
          {/* 채팅 화면이 머지되면 탭이 아닌 스택 화면(/chat)으로 연결한다. */}
          <MainTabButton icon={chatXml} label="채팅" />
        </MainTabBar>
      </TabList>
    </Tabs>
  );
}
