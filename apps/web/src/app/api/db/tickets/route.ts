import { NextRequest, NextResponse } from "next/server";
import { VisitorTicket } from "../../../../data/visitorData";
import {
  addTicketsToAccount,
  claimWorkerQrToAccount,
  getAccountWithTickets,
  listAccounts,
  listWorkerQrTickets,
  updateAccountTicketAction,
} from "../../../../lib/dbStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId") || "acc-kevcak";
  const details = getAccountWithTickets(accountId);
  if (!details.account) {
    return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({
    account: details.account,
    activeTickets: details.activeTickets,
    historyTickets: details.historyTickets,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: "claim-qr" | "add-tickets";
      accountId?: string;
      claimCode?: string;
      tickets?: VisitorTicket[];
    };

    const accountId = body.accountId || "acc-kevcak";

    if (body.action === "claim-qr") {
      const res = claimWorkerQrToAccount({
        accountId,
        claimCode: body.claimCode || "",
      });
      if (!res.ok) {
        const status = res.error?.includes("sudah diklaim") ? 409 : 400;
        return NextResponse.json({ error: res.error }, { status });
      }
      return NextResponse.json({
        qr: res.qr,
        ticket: res.ticket,
        activeTickets: res.activeTickets,
        historyTickets: res.historyTickets,
        accounts: listAccounts(),
        workerQrs: listWorkerQrTickets(),
      });
    }

    if (body.action === "add-tickets") {
      if (!Array.isArray(body.tickets) || body.tickets.length === 0) {
        return NextResponse.json(
          { error: "Daftar tiket tidak boleh kosong." },
          { status: 400 }
        );
      }
      const res = addTicketsToAccount({
        accountId,
        tickets: body.tickets,
      });
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        activeTickets: res.activeTickets,
        historyTickets: res.historyTickets,
        accounts: listAccounts(),
      });
    }

    return NextResponse.json(
      { error: "Action harus 'claim-qr' atau 'add-tickets'." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Request body tidak valid." },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      accountId?: string;
      ticketId?: string;
      action?: "join_queue" | "toggle_queue" | "use_ticket";
    };

    if (!body.accountId || !body.ticketId || !body.action) {
      return NextResponse.json(
        { error: "accountId, ticketId, dan action wajib diisi." },
        { status: 400 }
      );
    }

    const res = updateAccountTicketAction({
      accountId: body.accountId,
      ticketId: body.ticketId,
      action: body.action,
    });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 404 });
    }

    return NextResponse.json({
      ticket: res.ticket,
      activeTickets: res.activeTickets,
      historyTickets: res.historyTickets,
      accounts: listAccounts(),
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui status tiket." },
      { status: 400 }
    );
  }
}
