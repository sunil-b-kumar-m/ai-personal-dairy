import { prisma } from "../models/prisma.js";
import type { ReminderType, ReminderFrequency } from "@prisma/client";
import { ValidationError } from "../utils/errors.js";

export async function listReminders(userId: string, type?: string) {
  return prisma.reminder.findMany({
    where: {
      userId,
      isActive: true,
      ...(type ? { type: type as ReminderType } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUpcomingReminders(userId: string) {
  const reminders = await prisma.reminder.findMany({
    where: { userId, isActive: true },
  });

  const now = new Date();

  return reminders
    .map((r) => {
      let daysLeft: number;
      if (r.recurringDay) {
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), r.recurringDay);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, r.recurringDay);
        const target = thisMonth >= now ? thisMonth : nextMonth;
        daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else if (r.dueDate) {
        daysLeft = Math.ceil((r.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysLeft = 999;
      }
      return { ...r, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export async function createReminder(
  userId: string,
  data: {
    title: string;
    description?: string;
    dueDate?: Date;
    recurringDay?: number;
    frequency: ReminderFrequency;
  },
) {
  return prisma.reminder.create({
    data: {
      ...data,
      userId,
      type: "custom",
    },
  });
}

export async function updateReminder(
  id: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    recurringDay?: number;
    frequency?: ReminderFrequency;
    isActive?: boolean;
  },
) {
  return prisma.reminder.update({
    where: { id, userId },
    data,
  });
}

export async function deleteReminder(id: string, userId: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) return null;

  if (reminder.type !== "custom") {
    throw new ValidationError("Auto-generated reminders cannot be deleted directly. Deactivate the source card or loan instead.");
  }

  return prisma.reminder.delete({ where: { id } });
}

export async function generateReminders(userId: string) {
  const [creditCards, loans] = await Promise.all([
    prisma.creditCard.findMany({ where: { userId, isActive: true } }),
    prisma.loan.findMany({ where: { userId, isActive: true } }),
  ]);

  let created = 0;
  let updated = 0;

  // Sync credit card reminders
  for (const card of creditCards) {
    const existing = await prisma.reminder.findFirst({
      where: { userId, linkedEntityId: card.id, linkedEntityType: "credit_card" },
    });

    if (existing) {
      await prisma.reminder.update({
        where: { id: existing.id },
        data: {
          title: `${card.bankName} ${card.cardName} payment due`,
          recurringDay: card.dueDate,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.reminder.create({
        data: {
          userId,
          type: "credit_card_due",
          title: `${card.bankName} ${card.cardName} payment due`,
          linkedEntityId: card.id,
          linkedEntityType: "credit_card",
          recurringDay: card.dueDate,
          frequency: "monthly",
        },
      });
      created++;
    }
  }

  // Sync loan reminders
  for (const loan of loans) {
    const existing = await prisma.reminder.findFirst({
      where: { userId, linkedEntityId: loan.id, linkedEntityType: "loan" },
    });

    if (existing) {
      await prisma.reminder.update({
        where: { id: existing.id },
        data: {
          title: `${loan.lenderName} ${loan.loanType} EMI due`,
          recurringDay: loan.emiDueDate,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.reminder.create({
        data: {
          userId,
          type: "loan_emi",
          title: `${loan.lenderName} ${loan.loanType} EMI due`,
          linkedEntityId: loan.id,
          linkedEntityType: "loan",
          recurringDay: loan.emiDueDate,
          frequency: "monthly",
        },
      });
      created++;
    }
  }

  // Deactivate reminders for removed entities
  const activeCardIds = creditCards.map((c) => c.id);
  const activeLoanIds = loans.map((l) => l.id);

  const deleted = await prisma.reminder.updateMany({
    where: {
      userId,
      type: { in: ["credit_card_due", "loan_emi"] },
      linkedEntityId: { notIn: [...activeCardIds, ...activeLoanIds] },
    },
    data: { isActive: false },
  });

  return { created, updated, deactivated: deleted.count };
}
