"use client";
import ErrorScreen from "@/components/ErrorScreen";
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="ko"><body style={{ background: "#121815", color: "#e9edf5", fontFamily: "system-ui" }}><ErrorScreen {...props} /></body></html>;
}
