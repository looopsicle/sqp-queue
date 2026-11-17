import { AttractionId, VisitorTicket } from "./visitorData";

export interface DbAccountPublic {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
  activeTicketCount: number;
  historyTicketCount: number;
}

export interface DbAccountRecord extends DbAccountPublic {
  passwordHash: string;
}

export interface DbVisitorTicket extends VisitorTicket {
  accountId: string;
  claimCode?: string;
  createdAt: string;
}

export type WorkerQrAttractionId = Extract<
  AttractionId,
  "sqp-express" | "adventure-ropes"
>;

export interface WorkerQrTicketRecord {
  id: string;
  claimCode: string;
  posReceiptNumber: string;
  attractionId: WorkerQrAttractionId;
  attractionName: string;
  activityName: "SQP Express" | "Roll Glider";
  bundlingName?: string;
  adultCount: number;
  childCount: number;
  totalParticipants: number;
  status: "AVAILABLE" | "CLAIMED";
  qrImageUrl?: string;
  claimUrl?: string;
  issuedByWorker: string;
  claimedByAccountId?: string;
  claimedByUsername?: string;
  createdAt: string;
  claimedAt?: string;
}
