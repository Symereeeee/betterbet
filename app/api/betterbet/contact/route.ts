// app/api/betterbet/contact/route.ts
import { NextRequest, NextResponse } from "next/server";

// Configure your preferred service here:
// Option 1: Airtable - set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env.local
// Option 2: Google Sheets - set GOOGLE_SHEETS_WEBHOOK_URL in .env.local

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, socials } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // ============================================
    // OPTION 1: Airtable Integration
    // ============================================
    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME || "Contacts"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  Email: email,
                  "First Name": firstName,
                  "Last Name": lastName,
                  Socials: socials || "",
                  "Submitted At": timestamp,
                },
              },
            ],
          }),
        }
      );

      if (!airtableResponse.ok) {
        const errorText = await airtableResponse.text();
        console.error("Airtable error:", errorText);
        return NextResponse.json(
          { error: `Airtable error: ${errorText}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, service: "airtable" });
    }

    // ============================================
    // OPTION 2: Google Sheets Integration
    // Use Google Apps Script Web App as webhook
    // ============================================
    if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
      const sheetsResponse = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          socials: socials || "",
          timestamp,
        }),
      });

      if (!sheetsResponse.ok) {
        console.error("Google Sheets error:", await sheetsResponse.text());
        return NextResponse.json(
          { error: "Failed to save to Google Sheets" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, service: "google-sheets" });
    }

    // ============================================
    // FALLBACK: Console log (for development)
    // ============================================
    console.log("New contact submission:", {
      email,
      firstName,
      lastName,
      socials,
      timestamp,
    });

    // Return success even without external service (for testing)
    return NextResponse.json({
      success: true,
      service: "console",
      message: "Form submitted (no external service configured)"
    });

  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
