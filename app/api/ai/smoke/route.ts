import { runGatewaySmokeTest } from "@/lib/ai/gateway";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return Response.json(
      {
        error:
          "AI Gateway credentials are missing. Set AI_GATEWAY_API_KEY in .env.local.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await runGatewaySmokeTest();

    return Response.json(result);
  } catch (error) {
    console.error("AI Gateway smoke test failed", error);

    return Response.json(
      { error: "AI Gateway connection failed." },
      { status: 502 },
    );
  }
}
