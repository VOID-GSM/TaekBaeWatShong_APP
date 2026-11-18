import type { ParcelNotification } from '@taekbae/types';
import { Pressable, View } from 'react-native';

import {
  Card,
  type ColorToken,
  Icon,
  type IconName,
  makeStyles,
  Typography,
  useTheme,
} from '@/shared/ui';

import {
  formatNotificationTime,
  getNotificationKind,
  type NotificationKind,
} from '../model/notification';

export interface NotificationItemProps {
  notification: ParcelNotification;
  onPress?: (notification: ParcelNotification) => void;
  /** 테스트용 기준 시각 */
  now?: Date;
}

type KindTone = 'brand' | 'success' | 'warning' | 'neutral';

/**
 * 종류별 아이콘·색. 시안이 없어 기존 아이콘(`shared/assets/icons.ts`)으로 골랐다 — 디자인 미대조.
 * registered 는 package-plus 가 Icon 레지스트리에 없어 bell 로, claimed 는 check 로 대신한다.
 */
const kindVisuals: Record<NotificationKind, { icon: IconName; tone: KindTone }> = {
  registered: { icon: 'bell', tone: 'brand' },
  arrived: { icon: 'bell', tone: 'brand' },
  zoneAssigned: { icon: 'map', tone: 'brand' },
  claimed: { icon: 'check', tone: 'success' },
  unclaimedReminder: { icon: 'info', tone: 'warning' },
  unknown: { icon: 'bell', tone: 'neutral' },
};

const toneIconColors: Record<KindTone, ColorToken> = {
  brand: 'iconBrand',
  success: 'statusSuccess',
  // 경고 아이콘 색 토큰이 따로 없어 경고 글자색을 쓴다.
  warning: 'textWarning',
  neutral: 'iconDefault',
};

/** 알림 목록의 한 줄. 안 읽은 알림은 연한 브랜드 배경과 점으로 구분한다. */
export function NotificationItem({ notification, onPress, now }: NotificationItemProps) {
  const styles = useStyles();
  const { size } = useTheme();
  const { title, message, isRead, unclaimedDays } = notification;
  const { icon, tone } = kindVisuals[getNotificationKind(notification.type)];
  const time = formatNotificationTime(notification.createdAt, now);
  const showUnclaimedDays = unclaimedDays != null && unclaimedDays > 0;
  const accessibilityLabel = `${isRead ? '' : '안 읽음, '}${joinSentences([title, message, time])}`;

  const content = (
    <Card rounded="lg" style={[styles.card, !isRead && styles.unread]}>
      <View style={[styles.iconCircle, styles[iconBackground(tone, isRead)]]}>
        <Icon name={icon} color={toneIconColors[tone]} size={size.iconM} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Typography variant="bodyMStrong" style={styles.flex}>
            {title}
          </Typography>
          <Typography variant="caption" color="textTertiary">
            {time}
          </Typography>
          {!isRead && <View style={styles.dot} />}
        </View>
        <Typography color="textSecondary">{message}</Typography>
        {showUnclaimedDays && (
          <View style={styles.warningBadge}>
            <Typography variant="bodyMStrong" color="textWarning" numberOfLines={1}>
              미수령 {unclaimedDays}일
            </Typography>
          </View>
        )}
      </View>
    </Card>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => onPress(notification)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

/** 문장을 '. ' 로 잇는다. 서버 메시지는 '…니다.' 처럼 마침표로 끝나기도 해서, 끝 마침표를 떼고 이어 '..' 가 되지 않게 한다. */
function joinSentences(parts: string[]) {
  return parts.map((part) => part.trim().replace(/[.。]+$/, '')).join('. ');
}

/** 안 읽은 카드는 배경이 bgBrandSoft 라, 브랜드 아이콘 원은 한 단계 진한 색으로 띄운다. */
function iconBackground(tone: KindTone, isRead: boolean) {
  if (tone === 'brand') return isRead ? 'circleBrand' : 'circleBrandOnUnread';
  if (tone === 'success') return 'circleSuccess';
  if (tone === 'warning') return 'circleWarning';
  return 'circleNeutral';
}

const useStyles = makeStyles(({ colors, opacity, radius, size, spacing }) => ({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  unread: { backgroundColor: colors.bgBrandSoft },
  iconCircle: {
    width: size.iconButton,
    height: size.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  circleBrand: { backgroundColor: colors.bgBrandSoft },
  circleBrandOnUnread: { backgroundColor: colors.bgBrandSofter },
  circleSuccess: { backgroundColor: colors.bgSuccessSoft },
  circleWarning: { backgroundColor: colors.bgWarningSoft },
  circleNeutral: { backgroundColor: colors.bgNeutralSoft },
  body: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.iconBrand,
  },
  // Badge 에 경고 톤이 없어 같은 모양을 경고 색으로 그린다. (Badge 에 warning 톤이 생기면 교체)
  warningBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.bgWarningSoft,
  },
  pressed: { opacity: opacity.pressed },
}));
