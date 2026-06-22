type SocketLike = {
  readyState: number
  send: (message: string) => void
}

const OPEN_STATE = 1
const clients = new Map<string, Set<SocketLike>>()

export function registerClient(userId: string, socket: SocketLike) {
  const sockets = clients.get(userId) ?? new Set<SocketLike>()
  sockets.add(socket)
  clients.set(userId, sockets)
}

export function unregisterClient(userId: string, socket?: SocketLike) {
  if (!socket) {
    clients.delete(userId)
    return
  }

  const sockets = clients.get(userId)
  if (!sockets) {
    return
  }

  sockets.delete(socket)
  if (!sockets.size) {
    clients.delete(userId)
  }
}

export function notifyUser(userId: string, event: string, data: unknown) {
  const sockets = clients.get(userId)
  if (!sockets?.size) {
    return
  }

  for (const ws of sockets) {
    if (ws.readyState === OPEN_STATE) {
      ws.send(JSON.stringify({ event, data }))
    }
  }
}
