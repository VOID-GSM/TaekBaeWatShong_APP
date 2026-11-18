import { Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { scanBarcodeXml } from '@/shared/assets/scan-barcode';
import { Badge, BrandSurface, makeStyles, Typography, useTheme } from '@/shared/ui';

export interface ScannerHeroProps {
  /** 스캐너 입력을 받을 수 있다 (숨은 입력칸에 포커스가 있다) */
  isReady: boolean;
  /** 요청 중일 때 배지 문구 (예: '확인 중…'). 없으면 연결 상태를 보여 준다. */
  busyLabel?: string | null;
  /** 스캐너 입력이 끊겼을 때 눌러서 다시 연결한다 */
  onReconnect: () => void;
}

/** 회수 화면 상단 스캐너 안내 카드 (Figma `Scanner hero`). */
export function ScannerHero({ isReady, busyLabel, onReconnect }: ScannerHeroProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();

  return (
    <Pressable
      onPress={onReconnect}
      disabled={isReady}
      // 연결된 상태에서는 누를 일이 없으므로 '비활성 버튼'으로 읽히지 않게 버튼 역할을 뺀다.
      accessibilityRole={isReady ? undefined : 'button'}
      accessibilityLabel="스캐너로 바코드를 찍어주세요"
      accessibilityHint={isReady ? undefined : '눌러서 스캐너를 다시 연결해요'}
      accessibilityState={{ busy: Boolean(busyLabel) }}
    >
      <BrandSurface gradient="navy" angle={180} style={styles.hero}>
        <BrandSurface style={styles.icon}>
          <SvgXml
            xml={scanBarcodeXml}
            width={size.scannerIconGlyph}
            height={size.scannerIconGlyph}
            color={colors.iconOnBrand}
          />
        </BrandSurface>
        <Typography variant="headingH1" color="textOnNavy" align="center">
          스캐너로 바코드를 찍어주세요
        </Typography>
        <Typography color="textOnNavyMuted" align="center">
          {'스캔한 택배는 ‘가져간 택배’로 바뀌고\n관리자에게 알림이 가요'}
        </Typography>
        <View style={styles.badge}>
          {busyLabel ? (
            <Badge size="s" tone="brand" label={busyLabel} />
          ) : isReady ? (
            <Badge size="s" tone="success" label="스캐너 연결됨" />
          ) : (
            <Badge size="s" tone="neutral" label="눌러서 스캐너 연결" />
          )}
        </View>
      </BrandSurface>
    </Pressable>
  );
}

const useStyles = makeStyles(({ radius, shadow, size, spacing }) => ({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing['2xl'],
    borderRadius: radius['2xl'],
  },
  icon: {
    width: size.scannerIcon,
    height: size.scannerIcon,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    ...shadow.primaryGlow,
  },
  badge: { alignItems: 'center' },
}));
