import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { chatXml } from '@/shared/assets/chat';
import { flagXml } from '@/shared/assets/flag';
import { homeXml } from '@/shared/assets/home';
import { qrXml } from '@/shared/assets/qr';
import { scanBarcodeXml } from '@/shared/assets/scan-barcode';
import { MainTabBar, MainTabButton } from '@/widgets/main-tab-bar';

export default function TabsLayout() {
  // TODO: 신고 API 가 생기면 확인하지 않은 신고 여부로 바꾼다.
  const hasNewReports = false;

  return (
    <Tabs style={{ flex: 1 }}>
      {/* TabSlot 기본 스타일은 줄어들지 않아(flexShrink: 0) 내용이 길면 탭 바가 화면 밖으로 밀린다. */}
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <MainTabBar>
          <TabTrigger name="index" href="/" asChild>
            <MainTabButton icon={homeXml} label="홈" />
          </TabTrigger>
          <TabTrigger name="reports" href="/reports" asChild>
            <MainTabButton icon={flagXml} label="신고" showDot={hasNewReports} />
          </TabTrigger>
          <TabTrigger name="scan" href="/scan" asChild>
            <MainTabButton icon={scanBarcodeXml} label="택배 스캔" />
          </TabTrigger>
          <TabTrigger name="qr" href="/qr" asChild>
            <MainTabButton icon={qrXml} label="QR 코드" />
          </TabTrigger>
          {/* 채팅 화면이 머지되면 탭이 아닌 스택 화면(/chats)으로 연결한다. */}
          <MainTabButton icon={chatXml} label="채팅" disabled />
        </MainTabBar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // 탭 바를 뺀 나머지 높이만 차지하게 해서, 넘치는 내용은 각 화면의 ScrollView 가 스크롤한다.
  // TabSlot 기본값(flexShrink: 0)을 덮어쓰려면 flex 축약형이 아니라 개별 속성으로 줘야 한다.
  slot: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 },
});
