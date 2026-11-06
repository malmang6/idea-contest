import { connection } from "next/server";
import { FIELD_LABELS, type FieldCode } from "@/lib/fields";

// 서버 전용. 응답에는 건수만 담는다. 이름, 연락처, 메일, 아이디어 내용은 읽지도 돌려주지도 않는다.
// Airtable 요청에 fields[]=ai_field 를 걸어, 필요한 칸만 받아온다.

const AIRTABLE_TIMEOUT_MS = 15000;
const MAX_PAGES = 50; // 안전장치. 100건씩 최대 5,000건까지 센다.

type CountResponse = {
  ok: boolean;
  total?: number;
  byField?: Record<FieldCode | "UNCLASSIFIED", number>;
  message?: string;
};

export async function GET() {
  // 요청마다 새로 집계한다. 빌드 시점 결과가 캐시되지 않도록 한다.
  await connection();

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE ?? "Submissions";
  if (!token || !baseId) {
    console.error("status: Airtable 환경변수 누락");
    return Response.json(
      { ok: false, message: "현황을 불러올 수 없습니다." } satisfies CountResponse,
      { status: 500 }
    );
  }

  // 표시명 -> 코드 역매핑. Airtable에는 한글 표시명이 저장된다.
  const labelToCode = new Map<string, FieldCode>(
    (Object.entries(FIELD_LABELS) as [FieldCode, string][]).map(([code, label]) => [label, code])
  );

  const byField: Record<FieldCode | "UNCLASSIFIED", number> = {
    DETECT: 0,
    EDU: 0,
    POLICY: 0,
    SPREAD: 0,
    UNCLASSIFIED: 0,
  };
  let total = 0;
  let offset: string | undefined;

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams();
      params.append("fields[]", "ai_field");
      params.set("pageSize", "100");
      if (offset) params.set("offset", offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(AIRTABLE_TIMEOUT_MS),
          cache: "no-store",
        }
      );
      if (!res.ok) {
        // 상태 코드만 기록한다. 응답 본문은 기록하지 않는다.
        console.error(`status: Airtable 조회 실패 status=${res.status}`);
        return Response.json(
          { ok: false, message: "현황을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요." } satisfies CountResponse,
          { status: 502 }
        );
      }

      const data = (await res.json()) as {
        records?: { fields?: { ai_field?: unknown } }[];
        offset?: string;
      };
      for (const rec of data.records ?? []) {
        total += 1;
        const value = rec.fields?.ai_field;
        const code = typeof value === "string" ? labelToCode.get(value) : undefined;
        byField[code ?? "UNCLASSIFIED"] += 1;
      }

      offset = data.offset;
      if (!offset) break;
    }
  } catch {
    console.error("status: Airtable 연결 실패(시간 초과 또는 네트워크)");
    return Response.json(
      { ok: false, message: "현황을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요." } satisfies CountResponse,
      { status: 502 }
    );
  }

  return Response.json({ ok: true, total, byField } satisfies CountResponse);
}
