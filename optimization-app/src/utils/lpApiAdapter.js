export const FORMULATE_PATH = '/api/formulate-lp'
export const DEFAULT_FORMULATE_TIMEOUT_MS = 12000

export async function postFormulateLp(baseUrl, prompt, { timeoutMs = DEFAULT_FORMULATE_TIMEOUT_MS } = {}) {
  const endpoint = buildFormulateLpEndpoint(baseUrl)
  if (!endpoint) {
    throw new Error('No LP formulation API base URL is configured.')
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`)
    }

    const body = await response.json()
    const formulation = normalizeFormulationResponse(body)

    return {
      ok: true,
      data: formulation,
      source: 'live-gemini',
      apiEndpoint: endpoint,
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`API request timed out after ${Math.round(timeoutMs / 1000)} seconds`, { cause: error })
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function buildFormulateLpEndpoint(baseUrl) {
  const normalizedBaseUrl = String(baseUrl || '').trim().replace(/\/+$/, '')
  return normalizedBaseUrl ? `${normalizedBaseUrl}${FORMULATE_PATH}` : ''
}

function normalizeFormulationResponse(body) {
  if (body?.ok === false) {
    throw new Error(body.error || 'The API could not formulate this prompt.')
  }

  const formulation = body?.data || body?.formulation || body?.result || body

  if (!formulation || typeof formulation !== 'object') {
    throw new Error('The API did not return a formulation object.')
  }

  if (!formulation.solver_payload) {
    throw new Error('The API response is missing solver_payload.')
  }

  return formulation
}
