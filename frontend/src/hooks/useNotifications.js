// TODO (step 5): load GET /api/notifications, expose unread count + markRead(id).
export function useNotifications() {
  return { notifications: [], unread: 0 };
}
