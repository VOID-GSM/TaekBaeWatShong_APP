// 테스트 전역 설정. 네이티브 모듈 목(mock)이 필요해지면 여기에 추가한다.

// AsyncStorage 는 네이티브 모듈이라 Jest 에서는 패키지가 제공하는 메모리 구현으로 바꾼다.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
