import { NextRequest, NextResponse } from "next/server";
import {
  getAccountWithTickets,
  listAccounts,
  loginAccount,
  registerAccount,
  updateAccountProfile,
} from "../../../../lib/dbStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  const accounts = listAccounts();

  if (accountId) {
    const details = getAccountWithTickets(accountId);
    if (!details.account) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan.", accounts },
        { status: 404 }
      );
    }
    return NextResponse.json({
      accounts,
      account: details.account,
      activeTickets: details.activeTickets,
      historyTickets: details.historyTickets,
    });
  }

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: "register" | "login" | "switch";
      username?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      identifier?: string;
      accountId?: string;
      bypassPassword?: boolean;
    };

    if (body.action === "register") {
      const res = registerAccount({
        username: body.username || "",
        fullName: body.fullName,
        email: body.email || "",
        phone: body.phone,
        password: body.password || "",
      });
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(
        {
          account: res.account,
          activeTickets: res.activeTickets,
          historyTickets: res.historyTickets,
          accounts: listAccounts(),
        },
        { status: 201 }
      );
    }

    if (body.action === "login" || body.action === "switch") {
      const res = loginAccount({
        identifier: body.identifier,
        password: body.password,
        accountId: body.accountId,
        bypassPassword:
          body.action === "switch" ? true : Boolean(body.bypassPassword),
      });
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 401 });
      }
      return NextResponse.json({
        account: res.account,
        activeTickets: res.activeTickets,
        historyTickets: res.historyTickets,
        accounts: listAccounts(),
      });
    }

    return NextResponse.json(
      { error: "Action harus 'register', 'login', atau 'switch'." },
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
      username?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    if (!body.accountId) {
      return NextResponse.json(
        { error: "accountId wajib diisi." },
        { status: 400 }
      );
    }

    const res = updateAccountProfile({
      accountId: body.accountId,
      username: body.username,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const details = getAccountWithTickets(body.accountId);
    return NextResponse.json({
      account: res.account,
      activeTickets: details.activeTickets,
      historyTickets: details.historyTickets,
      accounts: listAccounts(),
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui profil." },
      { status: 400 }
    );
  }
}
