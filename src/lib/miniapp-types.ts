import type { LeadStatus, LeadSource } from "@prisma/client";

export interface MiniLeadNote {
  id: string;
  leadId: string;
  authorId: string;
  text: string;
  createdAt: string;
  author: { name: string };
}

export interface MiniLeadActivity {
  id: string;
  leadId: string;
  userId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { name: string };
}

export interface MiniLead {
  id: string;
  refNumber: string;
  source: LeadSource;
  fullName: string;
  phone: string;
  email: string | null;
  city: string | null;
  comment: string | null;
  preferredTime: string | null;
  itemsJson: string;
  totalPrice: number;
  status: LeadStatus;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: MiniLeadNote[];
  activities: MiniLeadActivity[];
}

export interface AssignableUser {
  id: string;
  name: string;
}

export interface MiniLeadItem {
  productId?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  criterionName?: string;
  variantLabel?: string;
}

export function parseLeadItems(itemsJson: string): MiniLeadItem[] {
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
