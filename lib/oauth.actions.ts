"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./supabase";
import { createSession } from "./auth";
import { DEPTS, VENDOR_FIELDS } from "./depts";
import { awardXp } from "./xp";
import { signupBonus } from "./ranks";
import { OAUTH_TEMP_COOKIE, NEXT_COOKIE, PROVIDER_LABEL, USERNAME_PREFIX, readOauthTemp, safeNext, type OauthProvider } from "./oauth";

export type OauthFormState = { error?: string } | undefined;

/** 🛡️ 닉네임 검사: 아이디 가입과 같은 규칙 (운영자 사칭 금지) */
const RESERVED = /관리자|운영자|운영팀|운영진|메디화이트|admin|manager|official|공식|매니저|고객센터/i;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

/** 세션 발급 → 원래 보려던 곳(또는 /home)으로. 임시 쿠키는 남기지 않습니다. */
async function finish(u: { id: string; username: string; nickname: string; dept: string; role: string }): Promise<never> {
  await createSession({ id: u.id, username: u.username, nickname: u.nickname, dept: u.dept, role: u.role === "admin" ? "admin" : "member" });
  const dest = safeNext(cookies().get(NEXT_COOKIE)?.value);
  cookies().delete(OAUTH_TEMP_COOKIE);
  cookies().delete(NEXT_COOKIE);
  redirect(dest);
}

/** 소셜 고유번호로 아이디를 만듭니다 (k_ 카카오 · g_ 구글 · n_ 네이버). 이미 쓰는 아이디면 짧은 꼬리를 붙여 피해요. */
async function freeUsername(s: ReturnType<typeof db>, provider: OauthProvider, oauthId: string) {
  const base = `${USERNAME_PREFIX[provider]}_${oauthId}`.slice(0, 20);
  for (let i = 0; i < 4; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 15)}_${crypto.randomUUID().replace(/-/g, "").slice(0, 4)}`;
    const { data } = await s.from("users").select("id").eq("username", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base.slice(0, 10)}_${Date.now().toString(36).slice(-6)}`;
}

/** 소셜 신규 회원(카카오·구글·네이버 공통): 직종 + 닉네임 + 규칙 동의만 받고 가입을 끝냅니다. */
export async function completeSocialSignup(_: OauthFormState, fd: FormData): Promise<OauthFormState> {
  const temp = await readOauthTemp(cookies().get(OAUTH_TEMP_COOKIE)?.value);
  if (!temp) redirect("/login?error=oauth_expired");

  const provider = temp.provider;
  const label = PROVIDER_LABEL[provider];
  const nickname = clean(fd.get("nickname"), 12);
  const dept = clean(fd.get("dept"), 30);
  const field = clean(fd.get("field"), 20);
  if (fd.get("agree") !== "on") return { error: "커뮤니티 규칙에 동의해주세요" };
  if (!nickname) return { error: "닉네임을 입력해주세요" };
  if (RESERVED.test(nickname.replace(/\s/g, ""))) return { error: "운영자로 오해할 수 있는 닉네임은 쓸 수 없어요" };
  if (!(DEPTS as readonly string[]).includes(dept)) return { error: "직종을 선택해주세요" };
  if (dept === "업체" && !(VENDOR_FIELDS as readonly string[]).includes(field)) return { error: "업체 분야를 선택해주세요" };

  const s = db();
  const { data: sameNick } = await s.from("users").select("id").eq("nickname", nickname).eq("dept", dept).limit(1);
  if (sameNick?.length) return { error: "같은 직종에 이미 있는 닉네임이에요" };

  // 콜백과 폼이 겹쳐 두 번 처리된 경우: 이미 만들어졌다면 그 계정으로 로그인
  const { data: already } = await s.from("users").select("id,username,nickname,dept,role").eq("oauth_provider", provider).eq("oauth_id", temp.oauth_id).maybeSingle();
  if (already) await finish(already);

  const username = await freeUsername(s, provider, temp.oauth_id);
  const { count } = await s.from("users").select("id", { count: "exact", head: true }).eq("stealth", false).not("username", "like", "zz\\_%");
  const order = (count ?? 0) + 1;
  const { data, error } = await s.from("users").insert({
    username,
    password_hash: null,
    nickname,
    dept,
    field: dept === "업체" ? field : null,
    role: "member",
    join_order: order,
    oauth_provider: provider,
    oauth_id: temp.oauth_id,
  }).select("id").single();
  if (error || !data) {
    // 같은 계정이 동시에 두 번 들어온 경우(유일 인덱스 충돌)는 이미 만든 계정으로 보냅니다
    if (error?.code === "23505") {
      const { data: raced } = await s.from("users").select("id,username,nickname,dept,role").eq("oauth_provider", provider).eq("oauth_id", temp.oauth_id).maybeSingle();
      if (raced) await finish(raced);
    }
    return { error: `${label} 가입에 실패했어요. 잠시 후 다시 시도해주세요` };
  }

  // 아이디 가입과 같은 가입 보너스 (가입 순번 기준)
  await awardXp(data.id, signupBonus(order), "signup", "signup").catch(() => 0);
  await finish({ id: data.id, username, nickname, dept, role: "member" });
}
