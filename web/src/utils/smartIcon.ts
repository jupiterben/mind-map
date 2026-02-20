/**
 * 根据节点文字匹配合适 Emoji，并生成图标用 data URL
 * 支持本地关键词匹配与 AI 提示词两种方式
 */

import { createAi } from './ai'

const TEXT_EMOJI_MAP: Record<string, string> = {
  任务: '📋',
  计划: '📌',
  待办: '✅',
  完成: '✅',
  会议: '📅',
  日程: '📆',
  提醒: '⏰',
  目标: '🎯',
  想法: '💡',
  创意: '💡',
  笔记: '📝',
  重要: '⭐',
  紧急: '🔥',
  工作: '💼',
  学习: '📚',
  生活: '🏠',
  健康: '💪',
  运动: '⚽',
  旅行: '✈️',
  美食: '🍜',
  购物: '🛒',
  财务: '💰',
  投资: '📈',
  开心: '😊',
  喜欢: '❤️',
  问题: '❓',
  风险: '⚠️',
  成功: '🎉',
  失败: '😔',
  task: '📋',
  plan: '📌',
  meeting: '📅',
  idea: '💡',
  note: '📝',
  work: '💼',
  learn: '📚',
  important: '⭐',
  goal: '🎯',
  question: '❓',
  risk: '⚠️'
}

const DEFAULT_EMOJI = '📌'

const EMOJI_CANVAS_SIZE = 64

export function getEmojiForText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return DEFAULT_EMOJI
  const t = text.trim()
  if (!t) return DEFAULT_EMOJI
  const lower = t.toLowerCase()
  for (const [key, emoji] of Object.entries(TEXT_EMOJI_MAP)) {
    if (t.includes(key) || lower.includes(key.toLowerCase())) return emoji
  }
  const emojiOnly = t.replace(/\s/g, '')
  if (emojiOnly.length <= 2 && /\p{Emoji}/u.test(emojiOnly)) return emojiOnly
  return DEFAULT_EMOJI
}

export function createEmojiDataUrl(emoji: string, size: number = EMOJI_CANVAS_SIZE): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = 'transparent'
  ctx.fillRect(0, 0, size, size)
  ctx.font = `${Math.round(size * 0.7)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2)
  return canvas.toDataURL('image/png')
}

export function extractEmojiFromAiResponse(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') return ''
  const t = str.trim()
  const match = t.match(/\p{Emoji_Presentation}|\p{Emoji}\uFE0F?/u)
  return match ? match[0] : ''
}

export function getSmartIconPrompt(text: string | null | undefined): string {
  const t = (text ?? '').trim().slice(0, 200)
  return `根据以下文本推荐一个最合适的 emoji 作为图标。只回复一个 emoji 字符，不要任何解释或标点。

文本：${t}`
}

export interface SmartIconAiConfig {
  provider?: string
  key?: string
  api?: string
  model?: string
  port?: number
  [key: string]: unknown
}

export function getEmojiForTextByAi(
  text: string | null | undefined,
  aiConfig: SmartIconAiConfig | null | undefined
): Promise<string> {
  const fallback = () => getEmojiForText(text)
  if (!text || typeof text !== 'string') return Promise.resolve(fallback())
  const t = text.trim()
  if (!t) return Promise.resolve(fallback())

  const config = aiConfig && typeof aiConfig === 'object' ? aiConfig : null
  const hasKey = config && !!(config.keys?.[config.provider as keyof typeof config.keys] ?? (config as { key?: string }).key)
  if (!hasKey) return Promise.resolve(fallback())

  return new Promise(resolve => {
    const ai = createAi(config)
    const prompt = getSmartIconPrompt(t)
    ai.request(
      { messages: [{ role: 'user', content: prompt }] },
      () => {},
      content => {
        const emoji = extractEmojiFromAiResponse(content)
        resolve(emoji || fallback())
      },
      () => resolve(fallback())
    )
  })
}
