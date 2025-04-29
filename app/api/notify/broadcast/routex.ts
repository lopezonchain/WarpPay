/*import { getAllUserNotificationDetails } from "@/lib/notification";
import { sendFrameNotification } from "@/lib/notification-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: messageBody } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "Title and body are required." },
        { status: 400 }
      );
    }

    const allUsers = await getAllUserNotificationDetails();

    const results: { fid: number; status: string; error?: any }[] = [];

    for (const { fid, notificationDetails } of allUsers) {
      const result = await sendFrameNotification({
        fid,
        title,
        body: messageBody,
        notificationDetails,
      });

      if (result.state === "error") {
        results.push({ fid, status: "error", error: result.error });
      } else if (result.state === "rate_limit") {
        results.push({ fid, status: "rate_limit" });
      } else {
        results.push({ fid, status: "success" });
      }
    }

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
*/