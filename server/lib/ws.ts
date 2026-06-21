type SocketLike = {
  readyState: number
  send: (message: string) => void
}

const OPEN_STATE = 1
const clients = new Map<string, SocketLike>()

export function registerClient(userId: string, socket: SocketLike) {
  clients.set(userId, socket)
}

export function unregisterClient(userId: string) {
  clients.delete(userId)
}

export function notifyUser(userId: string, event: string, data: unknown) {
  const ws = clients.get(userId)
  if (ws?.readyState === OPEN_STATE) {
    ws.send(JSON.stringify({ event, data }))
  }
}
