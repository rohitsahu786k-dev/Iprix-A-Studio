import { Notification } from "@/models";
import { notificationSchema, resourceHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = resourceHandlers(Notification, notificationSchema);
