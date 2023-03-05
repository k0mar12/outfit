import { useNuxtApp } from '#imports'

export const useEcho = () => {
  const { $echo } = useNuxtApp()
  const notificationNamespace = '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated'

  /**
   * Listen Echo events
   *
   * @param room
   * @param events
   */
  const listen = (room, events) => {
    Object.keys(events).forEach((key) => {
      room.listen(
        key === 'notification' ? notificationNamespace : key,
        payload => events[key](payload)
      )
    })
  }

  return {
    /**
     * After success connected
     *
     * @param callback
     */
    connected: (callback) => {
      if ($echo.connector.socket.connected) {
        Promise.resolve(callback())
      } else {
        $echo.connector.socket.on('connect', () => {
          Promise.resolve(callback())
        })
      }
    },

    /**
     * Connect to the socket
     *
     */
    connect: () => {
      $echo.connector.socket.connect()
    },

    /**
     * Disconnect from sockets
     *
     */
    disconnect: () => {
      $echo.connector.socket.disconnect()
    },

    /**
     * Public channel
     *
     * @param channel
     * @param events
     */
    joinPublic: (channel, events) => {
      listen($echo.channel(channel), events)
    },

    /**
     * Private channel
     *
     * @param channel
     * @param events
     */
    joinPrivate: (channel, events) => {
      listen($echo.private(channel), events)
    },

    /**
     * Presence channel
     *
     * @param channel
     * @param events
     */
    joinPresence: (channel, events) => {
      listen($echo.join(channel), events)
    },

    /**
     * Leave from channel
     *
     * @param channel
     */
    leave: (channel) => {
      $echo.leaveChannel(channel)
    }
  }
}
