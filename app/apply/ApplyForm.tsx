"use client";

import { useState, type FormEvent } from "react";
import {
  EMPTY_APPLICATION,
  hasErrors,
  validateApplication,
  type ApplicationErrors,
  type ApplicationInput,
} from "@/lib/validation";

const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none";

export default function ApplyForm() {
  const [form, setForm] = useState<ApplicationInput>(EMPTY_APPLICATION);
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "failed">("idle");
  const [serverMessage, setServerMessage] = useState<string>("");
  const [receiptNo, setReceiptNo] = useState<string>("");

  function update<K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (status !== "submitting") setStatus("idle");
  }

  // 한 번 누르면 응답이 올 때까지 버튼을 막는다. 실패해도 자동으로 다시 보내지 않는다.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting" || status === "done") return;

    const found = validateApplication(form);
    setErrors(found);
    if (hasErrors(found)) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");
    setServerMessage("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        receiptNo?: string;
        errors?: ApplicationErrors;
      };
      if (data.ok) {
        setReceiptNo(data.receiptNo ?? "");
        setStatus("done");
        return;
      }
      if (data.errors) setErrors(data.errors);
      setServerMessage(data.message ?? "접수에 실패했습니다. 잠시 후 다시 제출해 주세요.");
      setStatus("failed");
    } catch {
      setServerMessage("접수에 실패했습니다. 잠시 후 다시 제출해 주세요.");
      setStatus("failed");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-8 rounded-md border border-emerald-300 bg-emerald-50 p-5 text-emerald-900">
        <p className="font-semibold">접수가 완료되었습니다.</p>
        <p className="mt-2 text-sm">
          접수 번호: <span className="font-mono">{receiptNo || "-"}</span>
        </p>
        <p className="mt-2 text-xs text-emerald-800">
          AI 검토 결과는 초안이며, 최종 심사는 담당자가 합니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
      <Field label="팀명" error={errors.team_name} hint="1~30자">
        <input
          className={FIELD_CLASS}
          value={form.team_name}
          onChange={(e) => update("team_name", e.target.value)}
        />
      </Field>

      <Field label="구성원" error={errors.members} hint="이름을 쉼표로 구분 (예: 홍길동, 김철수)">
        <input
          className={FIELD_CLASS}
          value={form.members}
          onChange={(e) => update("members", e.target.value)}
        />
      </Field>

      <Field label="아이디어 제목" error={errors.idea_title} hint="1~60자">
        <input
          className={FIELD_CLASS}
          value={form.idea_title}
          onChange={(e) => update("idea_title", e.target.value)}
        />
      </Field>

      <Field label="아이디어 요약" error={errors.idea_summary} hint="10~1,000자. 문제 상황과 해결 방법을 적어 주세요.">
        <textarea
          rows={6}
          className={FIELD_CLASS}
          value={form.idea_summary}
          onChange={(e) => update("idea_summary", e.target.value)}
        />
      </Field>

      <Field label="기대 효과" error={errors.expected_effect} hint="10~500자. 누구에게 어떤 변화가 생기는지 적어 주세요.">
        <textarea
          rows={4}
          className={FIELD_CLASS}
          value={form.expected_effect}
          onChange={(e) => update("expected_effect", e.target.value)}
        />
      </Field>

      <Field label="연락처(전화)" error={errors.phone} hint="숫자와 하이픈(-), 9~13자. 회신용이며 공개되지 않습니다.">
        <input
          className={FIELD_CLASS}
          inputMode="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>

      <Field label="메일" error={errors.email} hint="회신용이며 공개되지 않습니다.">
        <input
          className={FIELD_CLASS}
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>

      <div>
        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
          />
          <span>
            응모 접수와 심사 결과 회신을 위해 이름, 연락처, 메일을 수집합니다. 수집한 정보는 공모전 종료 후
            파기하며 심사 과정 외에는 사용하지 않습니다. (보관 기간: 공모전 종료 후 3개월)
          </span>
        </label>
        {errors.consent && <p className="mt-1 text-sm text-red-600">{errors.consent}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {status === "submitting" ? "제출 중..." : "응모 제출"}
      </button>

      {status === "failed" && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {serverMessage}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
