import { NextRequest, NextResponse } from "next/server";
import { routeUpdate } from "@/bot/logic/router";
import { TelegramUpdate } from "@/bot/types";

export async function POST(req: NextRequest) {
  const update = (await req.json()) as TelegramUpdate;

  // Route update (async, no blocking)
  routeUpdate(update).catch(() => {});

  // Respond immediately to Telegram
  return NextResponse.json({ ok: true });
}
