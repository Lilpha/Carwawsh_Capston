/**
 * Metro가 %TEMP%에 두는 metro-file-map-* 캐시 삭제.
 * "deserialize" / 번들 0% 멈춤 등 이상할 때만 실행 (매번 X).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmp = os.tmpdir();
let removed = 0;
try {
  for (const name of fs.readdirSync(tmp)) {
    if (name.startsWith('metro-file-map')) {
      fs.rmSync(path.join(tmp, name), { recursive: true, force: true });
      removed++;
    }
  }
} catch (e) {
  console.warn('[clean-metro-file-map-cache]', e.message);
}
console.log(removed ? `Removed ${removed} metro-file-map cache entr(y/ies).` : 'No metro-file-map cache found.');
