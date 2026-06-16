import { z } from "zod";
import { fail, ok, parseBody, requireApiUser, userFilter } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { Notification, SupportTicket, User } from "@/models";
import { sendMailWithLog } from "@/lib/email/sender";

const ticketSchema = z.object({
  subject: z.string().min(3).max(160),
  message: z.string().min(10).max(4000),
  category: z.preprocess((value) => (value ? value : "general"), z.string()).default("general"),
  priority: z.preprocess((value) => (value ? value : "normal"), z.enum(["low", "normal", "high"])).default("normal"),
  attachmentUrl: z.string().url().optional().or(z.literal("")).default(""),
});

const patchSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  adminNotes: z.string().optional(),
  reply: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const filter = userFilter(auth.session);
  const [items, count] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).limit(100),
    SupportTicket.countDocuments(filter),
  ]);
  return ok({ items, count });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, ticketSchema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const item = await SupportTicket.create({ ...parsed.data, userId: auth.session.id });
  await Notification.create({
    userId: auth.session.id,
    type: "support",
    title: "Support ticket created",
    message: "Our team will review your ticket and reply from the admin panel.",
  });

  // Send support_ticket_created notification to the user
  await sendMailWithLog(auth.session.id, auth.session.email, "support_ticket_created", {
    name: auth.session.name,
    ticketId: String(item._id),
    subject: item.subject,
  });

  return ok({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return fail("Missing id");
  const parsed = await parseBody(request, patchSchema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const ticket = await SupportTicket.findById(id);
  if (!ticket) return fail("Ticket not found", 404);
  if (auth.session.role !== "admin" && String(ticket.userId) !== auth.session.id) return fail("Forbidden", 403);
  
  const oldStatus = ticket.status;
  const update: Record<string, unknown> = {};
  if (parsed.data.status) update.status = parsed.data.status;
  if (parsed.data.adminNotes && auth.session.role === "admin") update.adminNotes = parsed.data.adminNotes;
  if (Object.keys(update).length) ticket.set(update);
  if (parsed.data.reply) {
    ticket.replies.push({
      authorId: auth.session.id,
      authorRole: auth.session.role,
      message: parsed.data.reply,
      createdAt: new Date(),
    });
  }
  await ticket.save();
  await Notification.create({
    userId: ticket.userId,
    type: "support",
    title: "Support ticket updated",
    message: `Ticket "${ticket.subject}" is now ${ticket.status}.`,
  });

  // If reply added by admin, send ticket_replied email to user
  if (parsed.data.reply && auth.session.role === "admin") {
    const user = await User.findById(ticket.userId);
    if (user) {
      await sendMailWithLog(String(user._id), user.email, "ticket_replied", {
        name: user.name,
        ticketId: String(ticket._id),
        replyText: parsed.data.reply,
      });
    }
  }

  // If status changed to resolved or closed, send resolved notification
  if (
    (ticket.status === "resolved" || ticket.status === "closed") &&
    oldStatus !== "resolved" &&
    oldStatus !== "closed"
  ) {
    const user = await User.findById(ticket.userId);
    if (user) {
      await sendMailWithLog(String(user._id), user.email, "support_ticket_resolved", {
        name: user.name,
        ticketId: String(ticket._id),
        subject: ticket.subject,
      });
    }
  }

  return ok({ item: ticket });
}

