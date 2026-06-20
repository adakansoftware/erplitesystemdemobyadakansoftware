import type { NextRequest } from 'next/server'

const API_TARGET = (process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3001/api').replace(/\/$/, '')

function buildTargetUrl(path: string[], search: string) {
  const joinedPath = path.join('/')
  return `${API_TARGET}/${joinedPath}${search}`
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const targetUrl = buildTargetUrl(path, request.nextUrl.search)
  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  const authorization = request.headers.get('authorization')
  const cookie = request.headers.get('cookie')
  const accept = request.headers.get('accept')

  if (contentType) headers.set('content-type', contentType)
  if (authorization) headers.set('authorization', authorization)
  if (cookie) headers.set('cookie', cookie)
  if (accept) headers.set('accept', accept)

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  const upstream = await fetch(targetUrl, init)
  const responseHeaders = new Headers()
  const upstreamContentType = upstream.headers.get('content-type')
  const setCookie = upstream.headers.get('set-cookie')

  if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType)
  if (setCookie) responseHeaders.set('set-cookie', setCookie)

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
export const HEAD = proxy
