export const dynamic = "force-dynamic";
export function GET() { return Response.json({ v: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" }, { headers: { "Cache-Control": "no-store" } }); }
