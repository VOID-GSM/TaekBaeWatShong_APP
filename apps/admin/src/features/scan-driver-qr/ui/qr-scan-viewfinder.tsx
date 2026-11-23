import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

import { scanCornersXml } from '@/shared/assets/scan-corners';
import { BrandSurface, Button, makeStyles, Typography, useTheme } from '@/shared/ui';

export interface QrScanViewfinderProps {
  /** 카메라를 켤 때. 화면이 보이고 'QR 인식' 탭일 때만 true — 꺼지면 카메라를 내려 놓는다. */
  active: boolean;
  /** 카메라가 읽은 QR 값. 같은 값이 연달아 여러 번 온다. */
  onScan: (data: string) => void;
}

// Figma `Scan line`: 220 프레임 안 좌우 20 여백, 세로 가운데(top 108).
const SCAN_LINE_WIDTH = 180;
const SCAN_LINE_HEIGHT = 3;
const SCAN_LINE_TRAVEL = 88;
const SCAN_LINE_DURATION_MS = 1_600;
const SCAN_LINE_ANGLE = 178.91;
// 모서리 선 두께(5)만큼 SVG 가 프레임보다 크다 — Figma 의 inset -0.3% 와 같은 위치에 둔다.
const CORNERS_SIZE = 221.333;
const VIEWFINDER_GAP = 10;

/** QR 인식 카메라 (Figma `ScanViewfinder`). 권한이 없으면 같은 자리에 권한 안내를 보여 준다. */
export function QrScanViewfinder({ active, onScan }: QrScanViewfinderProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const requestedRef = useRef(false);
  const granted = permission?.granted === true;
  const canAskAgain = permission?.canAskAgain !== false;

  // 탭을 열면 바로 카메라가 뜨도록, 처음 한 번은 버튼을 누르지 않아도 권한을 요청한다.
  useEffect(() => {
    if (!active || permission === null || granted || !canAskAgain || requestedRef.current) return;
    requestedRef.current = true;
    void requestPermission();
  }, [active, permission, granted, canAskAgain, requestPermission]);

  return (
    <View style={styles.box} testID="qr-scan-viewfinder">
      {granted && active && (
        <CameraView
          testID="qr-camera"
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => onScan(data)}
        />
      )}

      {granted ? (
        <>
          <View style={styles.frame} accessibilityElementsHidden importantForAccessibility="no">
            <SvgXml
              xml={scanCornersXml}
              width={CORNERS_SIZE}
              height={CORNERS_SIZE}
              color={colors.textOnNavy}
              style={styles.corners}
            />
            <ScanLine />
          </View>
          <Typography variant="caption" color="textOnNavyMuted" align="center">
            QR을 사각형 안에 맞춰주세요
          </Typography>
        </>
      ) : (
        <View style={styles.permission}>
          <Typography variant="bodyMStrong" color="textOnNavy" align="center">
            {permission === null ? '카메라를 준비하고 있어요' : '카메라 권한이 필요해요'}
          </Typography>
          {permission !== null && (
            <>
              <Typography variant="caption" color="textOnNavyMuted" align="center">
                {canAskAgain
                  ? '기사님 QR을 인식하려면 카메라를 허용해 주세요.'
                  : '설정에서 카메라 권한을 허용해 주세요.'}
              </Typography>
              <Button
                size="small"
                variant="soft"
                label={canAskAgain ? '카메라 허용' : '설정 열기'}
                onPress={() => void (canAskAgain ? requestPermission() : Linking.openSettings())}
                style={styles.permissionButton}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

/** 프레임 안을 위아래로 훑는 선. '동작 줄이기'를 켜면 시안처럼 가운데에 멈춰 있다. */
function ScanLine() {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.set(0);
      return;
    }
    progress.set(-1);
    progress.set(withRepeat(withTiming(1, { duration: SCAN_LINE_DURATION_MS }), -1, true));
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.get() * SCAN_LINE_TRAVEL }],
  }));

  return (
    <Animated.View style={[styles.scanLineGlow, animatedStyle]}>
      <BrandSurface angle={SCAN_LINE_ANGLE} style={styles.scanLine} />
    </Animated.View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, size, spacing }) => ({
  box: {
    alignSelf: 'stretch',
    height: size.scanViewfinder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: VIEWFINDER_GAP,
    padding: spacing.sm,
    borderRadius: radius['2xl'],
    backgroundColor: colors.bgScanner,
    overflow: 'hidden',
  },
  frame: {
    width: size.scanFrame,
    height: size.scanFrame,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corners: {
    position: 'absolute',
    left: (size.scanFrame - CORNERS_SIZE) / 2,
    top: (size.scanFrame - CORNERS_SIZE) / 2,
  },
  scanLineGlow: { borderRadius: 2, ...shadow.scanGlow },
  scanLine: { width: SCAN_LINE_WIDTH, height: SCAN_LINE_HEIGHT, borderRadius: 2 },
  permission: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing['2xl'] },
  permissionButton: { alignSelf: 'center', marginTop: spacing.sm },
}));
