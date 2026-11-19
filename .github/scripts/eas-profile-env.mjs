// eas.json 빌드 프로필의 env(extends 포함)를 KEY=VALUE 줄로 출력한다.
// eas update 는 빌드 프로필의 env 를 읽지 않으므로, OTA 번들도 빌드와 같은 API URL 을 쓰도록
// 워크플로우에서 이 출력을 $GITHUB_ENV 에 넣는다.
// usage: node eas-profile-env.mjs <eas.json 경로> <프로필>
import { readFileSync } from 'node:fs';

const [easJsonPath, profileName] = process.argv.slice(2);
if (!easJsonPath || !profileName) {
  console.error('usage: node eas-profile-env.mjs <eas.json> <profile>');
  process.exit(1);
}

const profiles = JSON.parse(readFileSync(easJsonPath, 'utf8')).build ?? {};

function resolveEnv(name, seen = new Set()) {
  const profile = profiles[name];
  if (!profile) throw new Error(`eas.json 에 '${name}' 프로필이 없습니다.`);
  if (seen.has(name)) throw new Error(`'${name}' 프로필의 extends 가 순환합니다.`);
  seen.add(name);
  const parentEnv = profile.extends ? resolveEnv(profile.extends, seen) : {};
  return { ...parentEnv, ...profile.env };
}

for (const [key, value] of Object.entries(resolveEnv(profileName))) {
  console.log(`${key}=${value}`);
}
