import { Alert, Platform } from 'react-native';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}

// 이 프로젝트는 DOM 타입(lib.dom)을 쓰지 않아 웹에서만 있는 confirm 을 직접 선언한다.
const webConfirm = (globalThis as { confirm?: (message: string) => boolean }).confirm;

/**
 * 확인·취소 창을 띄우고 확인을 눌렀으면 true 를 돌려준다.
 * 웹은 `Alert.alert` 의 버튼이 동작하지 않아 브라우저 confirm 을 쓴다.
 */
export function confirmAsync({
  title,
  message,
  confirmLabel,
  cancelLabel = '취소',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(webConfirm?.(message ? `${title}\n\n${message}` : title) ?? true);
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      // Android 는 바깥을 눌러 닫을 수 있고, 그때는 취소로 본다.
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
