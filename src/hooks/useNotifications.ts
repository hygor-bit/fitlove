import { useEffect, useRef, useCallback } from 'react'

export function useNotifications() {
  const permissionRef = useRef<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    permissionRef.current = Notification.permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        permissionRef.current = p
      })
    }
  }, [])

  const notify = useCallback((title: string, body: string, icon = '/icons/icon-192.png') => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (document.visibilityState === 'visible') return // app esta aberta e em foco
    if (permissionRef.current !== 'granted') return
    new Notification(title, { body, icon, badge: '/icons/icon-192.png' })
  }, [])

  return { notify }
}
