import {
  hasErrors,
  validateApplication,
  type ApplicationInput,
} from "@/lib/validation";
import { runReview, type ReviewInput } from "@/lib/review";

// 서버 전용 코드. AIRTABLE_TOKEN은 이 파일에서만 읽는다. 화면 코드로 가져가지 않는다.
// 자동 재시도는 하지 않는다. 실패하면 한 번 실패로 응답하고 사용자가 직접 다시 제출한다.

const AIRTABLE_TIMEOUT_MS = 15000;

function toInput(raw: unknown): ApplicationInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : "");
  return {
    team_name: str("team_name"),
    members: str("members"),
    idea_title: str("idea_title"),
    idea_summary: str("idea_summary"),
    expected_effect: str("expected_effect"),
    phone: str("phone"),
    email: str("email"),
    consent: r.consent === true,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const input = toInput(body);
  if (!input) {
    return Response.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const errors = validateApplication(input);
  if (hasErrors(errors)) {
    return Response.json(
      { ok: false, message: "입력 내용을 다시 확인해 주세요.", errors },
      { status: 400 }
    );
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE ?? "Submissions";
  if (!token || !baseId) {
    // 키 값은 응답에 넣지 않는다. 설정 누락만 알려준다.
    console.error("apply: Airtable 환경변수 누락");
    return Response.json(
      { ok: false, message: "접수 설정에 문제가 있습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  const fields = {
    team_name: input.team_name.trim(),
    members: input.members.trim(),
    idea_title: input.idea_title.trim(),
    idea_summary: input.idea_summary.trim(),
    expected_effect: input.expected_effect.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    submitted_at: new Date().toISOString(),
  };

  let res: Response;
  try {
    res = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields }] }),
        signal: AbortSignal.timeout(AIRTABLE_TIMEOUT_MS),
        cache: "no-store",
      }
    );
  } catch {
    console.error("apply: Airtable 연결 실패(시간 초과 또는 네트워크)");
    return Response.json(
      { ok: false, message: "접수에 실패했습니다. 잠시 후 다시 제출해 주세요." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    // 상태 코드만 기록한다. 응답 본문과 입력 내용은 기록하지 않는다.
    console.error(`apply: Airtable 저장 실패 status=${res.status}`);
    return Response.json(
      { ok: false, message: "접수에 실패했습니다. 잠시 후 다시 제출해 주세요." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { records?: { id: string }[] };
  const recordId = data.records?.[0]?.id ?? "";

  // 응모는 이미 저장됐다. AI 검토는 같은 요청 안에서 1회만 시도하고, 실패해도 응모 응답은 성공으로 둔다.
  if (recordId) {
    await attachReview(recordId, token, baseId, table, {
      team_name: fields.team_name,
      idea_title: fields.idea_title,
      idea_summary: fields.idea_summary,
      expected_effect: fields.expected_effect,
    });
  }

  return Response.json({
    ok: true,
    receiptNo: recordId.slice(0, 8),
  });
}

// AI 결과를 같은 레코드에 기록한다. 실패하면 AI 칸은 비우고 ai_status만 "실패"로 남긴다.
async function attachReview(
  recordId: string,
  token: string,
  baseId: string,
  table: string,
  input: ReviewInput
) {
  const outcome = await runReview(input);
  const aiFields = outcome.ok
    ? {
        ai_field: outcome.result.field,
        ai_score: outcome.result.score,
        ai_score_reason: outcome.result.score_reason,
        ai_review: outcome.result.review,
        ai_status: "성공",
      }
    : {
        ai_field: null,
        ai_score: null,
        ai_score_reason: null,
        ai_review: null,
        ai_status: "실패",
      };

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: aiFields }),
        signal: AbortSignal.timeout(AIRTABLE_TIMEOUT_MS),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error(`apply: AI 결과 기록 실패 status=${res.status}`);
    }
  } catch {
    console.error("apply: AI 결과 기록 중 연결 실패");
  }
}
