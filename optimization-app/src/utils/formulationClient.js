import { formulateLocally } from './localFormulation.js'
import { DEFAULT_FORMULATE_TIMEOUT_MS, buildFormulateLpEndpoint, postFormulateLp } from './lpApiAdapter.js'

const CONFIG_URL = `${import.meta.env.BASE_URL}optimization-config.json`
const CACHE_PREFIX = 'optimization-workbench:'
export const PROMPT_MAX_LENGTH = 2500

let runtimeConfigPromise

export async function formulatePrompt(prompt, { useLiveApi = true } = {}) {
  const normalizedPrompt = String(prompt || '').trim()

  if (!normalizedPrompt) {
    throw new Error('Enter a linear-programming problem statement first.')
  }

  if (normalizedPrompt.length > PROMPT_MAX_LENGTH) {
    throw new Error('Keep the prompt under 2,500 characters for the public demo.')
  }

  const demoResponse = {
    ok: true,
    data: formulateLocally(normalizedPrompt),
    source: 'cached-demo',
    isOfflineFallback: true,
    offlineNotice: 'Generated from local portfolio templates. Configure a live API base URL to enable model-backed NLP.',
  }

  if (!useLiveApi) return demoResponse

  const apiBaseUrl = await getFormulateApiBaseUrl()
  if (!apiBaseUrl) return demoResponse

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return buildUnavailableResponse(demoResponse, 'Browser is offline.')
  }

  const apiEndpoint = buildFormulateLpEndpoint(apiBaseUrl)
  const cacheKey = `${CACHE_PREFIX}${apiEndpoint}:${normalizedPrompt}`
  const cached = readCachedResponse(cacheKey)
  if (cached) return { ...cached, fromSessionCache: true }

  try {
    const timeoutMs = await getFormulateTimeoutMs()
    const result = await postFormulateLp(apiBaseUrl, normalizedPrompt, { timeoutMs })

    writeCachedResponse(cacheKey, result)
    return result
  } catch (error) {
    return buildUnavailableResponse(demoResponse, error instanceof Error ? error.message : String(error))
  }
}

export async function getFormulateApiBaseUrl() {
  if (import.meta.env.VITE_LP_API_BASE_URL) return import.meta.env.VITE_LP_API_BASE_URL

  const config = await getRuntimeConfig()
  return String(config.formulateApiBaseUrl || '').trim()
}

export async function getFormulateTimeoutMs() {
  const envTimeout = Number(import.meta.env.VITE_LP_API_TIMEOUT_MS)
  if (Number.isFinite(envTimeout) && envTimeout > 0) return envTimeout

  const config = await getRuntimeConfig()
  const configTimeout = Number(config.formulateTimeoutMs)
  return Number.isFinite(configTimeout) && configTimeout > 0
    ? configTimeout
    : DEFAULT_FORMULATE_TIMEOUT_MS
}

async function getRuntimeConfig() {
  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch(CONFIG_URL)
      .then((response) => (response.ok ? response.json() : {}))
      .catch(() => ({}))
  }

  return runtimeConfigPromise
}

function readCachedResponse(key) {
  try {
    const value = window.sessionStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function writeCachedResponse(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Session caching is opportunistic; failure should not block formulation.
  }
}

function buildUnavailableResponse(demoResponse, liveError) {
  return {
    ...demoResponse,
    source: 'api-unavailable',
    liveError,
    offlineNotice: 'The live Gemini formulation API was unavailable, so the page used a local deterministic formulation template.',
  }
}
