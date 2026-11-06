"use client";

import { useState } from "react";
import { FIELD_LABELS, type FieldCode } from "@/lib/fields";

type Counts = {
  total: number;
  byField: Record<FieldCode | "UNCLASSIFIED", number>;
};

const ROWS: { key: FieldCode | "UNCLASSIFIED"; label: string }[] = [
  { key: "DETECT", label: FIELD_LABELS.DETECT },
  { key: "EDU", label: FIELD_LABELS.EDU },
  { key: "POLICY", label: FIELD_LABELS.POLICY },
  { key: "SPREAD", label: FIELD_LABELS.SPREAD },
  { key: "UNCLASSIFIED", label: "미분류 (AI 검토 전 또는 실패)" },
];

// 화면을 열어도 호출하지 않는다. 새로고침 버튼을 눌렀을 때만 건수를 불러온다.
export default function StatusPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; total?: number; byField?: Counts["byField"]; message?: string };
      if (!data.ok || data.total === undefined || !data.byField) {
        setError(data.message ?? "현황을 불러올 수 없습니다.");
        return;
      }
      setCounts({ total: data.total, byField: data.byField });
    } catch {
      setError("현황을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold">접수 현황</h1>
      <p className="mt-2 text-sm text-zinc-600">
        분야별 접수 건수만 보여 줍니다. 응모자 정보와 아이디어 내용은 공개되지 않습니다.
      </p>

      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="mt-6 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? "불러오는 중..." : counts ? "새로고침" : "현황 보기"}
      </button>

      {error && (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}

      {counts && (
        <div className="mt-6">
          <p className="text-lg font-semibold">총 {counts.total}건</p>
          <table className="mt-4 w-full border-collapse text-sm">
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="border-b border-zinc-200">
                  <td className="py-2 text-zinc-800">{row.label}</td>
                  <td className="py-2 text-right font-mono">{counts.byField[row.key]}건</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-zinc-500">
            AI 분야는 참고용 초안입니다. 최종 심사는 담당자가 합니다.
          </p>
        </div>
      )}
    </main>
  );
}
