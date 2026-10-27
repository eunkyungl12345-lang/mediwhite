"use client";
import { useFormState } from "react-dom";
import { adminSetContactEmail, type FormState } from "@/lib/actions";
export default function AdminContact({ email }: { email: string }) {
  const [st, action] = useFormState<FormState, FormData>(adminSetContactEmail, undefined);
  return <form action={action} className="row"><input name="email" defaultValue={email} placeholder="문의 받을 이메일" /><button className="btn ghost">이메일 저장</button>{st?.ok && <span className="muted">{st.ok}</span>}</form>;
}
