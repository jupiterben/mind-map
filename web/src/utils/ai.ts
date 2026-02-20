export type ApiType = 'huoshan' | 'deepseek' | 'minimax'

export interface AiOptions {
  key?: string
  model?: string
  method?: string
  port?: number
}

/** 根据 provider 字符串得到合法 ApiType，避免多处重复三元 */
export function getApiType(provider: string | undefined): ApiType {
  return provider === 'deepseek' || provider === 'minimax' ? provider : 'huoshan'
}

type Provider = 'volcano_ark' | 'deepseek' | 'minimax'

/** 从配置中取当前 provider 对应的 API Key（兼容旧版单 key） */
export function getEffectiveKey(config: AiOptions & { provider?: string; keys?: Partial<Record<Provider, string>>; key?: string }): string {
  if (!config) return ''
  const p = config.provider as Provider | undefined
  if (p && config.keys && config.keys[p] !== undefined) return config.keys[p] ?? ''
  return (config as { key?: string }).key ?? ''
}

/** 工厂：创建并完成 init 的 Ai 实例 */
export function createAi(config: AiOptions & { provider?: string; keys?: Partial<Record<Provider, string>>; key?: string }): Ai {
  const instance = new Ai({ port: config.port })
  const key = getEffectiveKey(config)
  instance.init(getApiType(config.provider), { ...config, key })
  return instance
}

interface BaseData {
  method?: string
  headers?: { Authorization?: string }
  data?: {
    model?: string
    stream?: boolean
    messages?: Array<{ role: string; content: string }>
  }
}

interface StreamDelta {
  content?: string
}

interface StreamChoice {
  delta: StreamDelta
}

interface StreamChunk {
  choices?: StreamChoice[]
}

class Ai {
  options: AiOptions
  baseData: BaseData
  controller: AbortController
  currentChunk: string
  content: string
  apiType!: ApiType

  constructor(options: AiOptions = {}) {
    this.options = options
    this.baseData = {}
    this.controller = new AbortController()
    this.currentChunk = ''
    this.content = ''
  }

  init(type: ApiType = 'huoshan', options: AiOptions = {}): void {
    this.apiType = type
    this.baseData = {
      method: options.method || 'POST',
      headers: {
        Authorization: 'Bearer ' + options.key
      },
      data: {
        model: options.model,
        stream: true
      }
    }
  }

  async request(
    data: { messages?: Array<{ role: string; content: string }> },
    progress: (content: string) => void = () => { },
    end: (content: string) => void = () => { },
    err: (error: unknown) => void = () => { }
  ): Promise<void> {
    try {
      const res = await this.postMsg(data)
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await res.read()
        if (done) {
          return
        }
        const text = decoder.decode(value)
        const chunk = this.handleChunkData(text)
        if (this.currentChunk) continue
        let isEnd = false
        const list = chunk
          .split('\n')
          .filter(item => {
            isEnd = item.includes('[DONE]')
            return !!item && !isEnd
          })
          .map(item => JSON.parse(item.replace(/^data:/, '')) as StreamChunk)
        list.forEach(item => {
          this.content += (item.choices ?? [])
            .map(item2 => item2.delta?.content ?? '')
            .join('')
        })
        progress(this.content)
        if (isEnd) {
          end(this.content)
        }
      }
    } catch (error) {
      console.log(error)
      if (!(error && (error as Error).name === 'AbortError')) {
        err(error)
      }
    }
  }

  /** 各 API 类型对应的代理路径（vite proxy 转发到对应厂商） */
  private static readonly PROXY_PATH: Record<ApiType, string> = {
    huoshan: '/api/huoshan/coding/v3',
    deepseek: '/api/deepseek/v1/chat/completions',
    minimax: '/api/minimax/v1/text/chatcompletion_v2'
  }

  async postMsg(data: { messages?: Array<{ role: string; content: string }> }): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    this.controller = new AbortController()
    const url = Ai.PROXY_PATH[this.apiType]
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: this.baseData.headers?.Authorization ?? ''
    }
    const body = JSON.stringify({
      model: this.baseData.data?.model,
      stream: true,
      messages: data.messages ?? []
    })
    const res = await fetch(url, {
      signal: this.controller.signal,
      method: 'POST',
      headers,
      body
    })
    if (res.status && res.status !== 200) {
      throw new Error('请求失败')
    }
    const bodyReader = res.body?.getReader()
    if (!bodyReader) throw new Error('No response body')
    return bodyReader
  }

  handleChunkData(chunk: string): string {
    chunk = chunk.trim()
    if (this.currentChunk) {
      chunk = this.currentChunk + chunk
      this.currentChunk = ''
    }
    if (chunk.includes('[DONE]')) {
      return chunk
    }
    if (chunk[chunk.length - 1] !== '}') {
      this.currentChunk = chunk
    }
    return chunk
  }

  stop(): void {
    this.controller.abort()
    this.controller = new AbortController()
  }
}

export default Ai
