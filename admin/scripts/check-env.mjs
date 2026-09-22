import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const mode = process.argv[2]
if (mode !== 'staging' && mode !== 'production') {
  console.error('[check-env] 期望 staging 或 production 模式')
  process.exit(1)
}
const env = loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), 'VITE_')
let valid = false
try {
  const url = new URL(env.VITE_API_BASE_URL)
  valid =
    url.protocol === 'https:' &&
    !url.hostname.includes('example.com') &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash
} catch {}
if (!valid) {
  console.error(
    '[check-env] VITE_API_BASE_URL 必须为非 example.com 占位的有效 HTTPS 地址，且不含凭据、查询或片段',
  )
  process.exit(1)
}
console.log(`[check-env] ${mode} 环境校验通过`)
