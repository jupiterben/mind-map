/**
 * 测试 AI 代理请求（需先启动 dev：pnpm dev）
 * 用法：API_KEY=your_key [BASE_URL=http://localhost:5173] [MODEL=doubao-pro-128k] node scripts/test-ai.mjs
 */
const BASE_URL = "https://ark.cn-beijing.volces.com/api/coding/v3/text"
const API_KEY = process.env.API_KEY || 'f0338840-f61b-4835-8c30-40694c4756db'
const MODEL = process.env.MODEL || 'doubao-pro-128k'

if (!API_KEY) {
  console.error('请设置环境变量 API_KEY')
  process.exit(1)
}

const url = `${BASE_URL}`
const body = JSON.stringify({
  model: MODEL,
  stream: true,
  messages: [{ role: 'user', content: '说一个字：好' }]
})

console.log('请求:', url)
console.log('---')

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`
  },
  body
})

if (!res.ok) {
  console.error('HTTP', res.status, res.statusText)
  console.error(await res.text())
  process.exit(1)
}

const reader = res.body?.getReader()
if (!reader) {
  console.error('无响应体')
  process.exit(1)
}

const decoder = new TextDecoder()
let full = ''
for (;;) {
  const { done, value } = await reader.read()
  if (done) break
  const text = decoder.decode(value)
  const lines = text.split('\n').filter((l) => l.startsWith('data:') && !l.includes('[DONE]'))
  for (const line of lines) {
    try {
      const json = JSON.parse(line.slice(5))
      const content = json.choices?.[0]?.delta?.content
      if (content) {
        full += content
        process.stdout.write(content)
      }
    } catch (_) {}
  }
}
console.log('\n---\n完整回复长度:', full.length)
