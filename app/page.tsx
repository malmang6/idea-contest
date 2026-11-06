import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const criteria = [
  {
    name: "문제의 중요성",
    desc: "허위정보 문제를 핵심적으로 다루는가",
  },
  {
    name: "실현 가능성",
    desc: "대학생 팀이 실제로 실행할 수 있는가",
  },
  {
    name: "독창성·효과",
    desc: "기존과 다른 접근이며 기대 효과가 구체적인가",
  },
];

const prizes = [
  { name: "대상", count: "1팀", amount: "100만 원" },
  { name: "최우수상", count: "2팀", amount: "각 50만 원" },
  { name: "우수상", count: "3팀", amount: "각 30만 원" },
];

const fields = [
  { name: "탐지·검증 기술", desc: "허위정보를 찾아내거나 사실 여부를 확인하는 기술·도구" },
  { name: "교육·미디어 리터러시", desc: "정보를 판별하는 능력을 기르는 교육·캠페인" },
  { name: "제도·정책", desc: "플랫폼 규율, 신고·구제 체계, 공공기관 대응 절차" },
  { name: "확산 차단·커뮤니티", desc: "허위정보가 퍼지는 경로를 줄이는 커뮤니티 설계" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="space-y-4">
        <p className="text-sm font-medium text-zinc-500">공모전 안내</p>
        <h1 className="text-3xl font-bold tracking-tight">
          허위정보 대응 대학생 아이디어 공모전
        </h1>
        <p className="text-lg text-zinc-700">
          허위정보가 사회에 미치는 피해를 줄이는 아이디어를 대학생에게서 모집합니다.
        </p>
        <Link href="/apply" className={buttonVariants({ size: "lg" })}>
          응모하기
        </Link>
      </header>

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold">응모 자격 · 접수 기간</h2>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700">
          <li>대학 재학생 및 휴학생</li>
          <li>팀 단위 응모 (구성원 이름을 쉼표로 구분해 적습니다)</li>
          <li>접수 기간: 2026년 11월 6일(목) ~ 2026년 12월 20일(일)</li>
        </ul>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold">시상</h2>
        <table className="w-full border-collapse text-left text-zinc-700">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="py-2 font-medium">상</th>
              <th className="py-2 font-medium">팀 수</th>
              <th className="py-2 font-medium">상금</th>
            </tr>
          </thead>
          <tbody>
            {prizes.map((p) => (
              <tr key={p.name} className="border-b border-zinc-200">
                <td className="py-2">{p.name}</td>
                <td className="py-2">{p.count}</td>
                <td className="py-2">{p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold">응모 방법</h2>
        <ol className="list-decimal space-y-1 pl-5 text-zinc-700">
          <li>응모하기 페이지에서 팀명, 구성원, 아이디어 제목, 아이디어 요약, 기대 효과를 입력합니다.</li>
          <li>회신을 받을 전화번호와 메일 주소를 입력합니다.</li>
          <li>개인정보 수집·이용에 동의하고 제출합니다.</li>
          <li>접수가 완료되면 접수 번호가 표시됩니다.</li>
        </ol>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold">분야 (하나만 선택)</h2>
        <p className="text-zinc-700">
          응모작은 아래 4개 분야 중 가장 중심이 되는 분야 하나로 분류됩니다.
        </p>
        <ul className="space-y-2 text-zinc-700">
          {fields.map((f) => (
            <li key={f.name}>
              <span className="font-medium text-zinc-900">{f.name}</span>
              <span className="text-zinc-600"> · {f.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold">심사 기준</h2>
        <p className="text-zinc-700">
          세 기준을 균형 있게 보고 종합 점수(1~5점, 정수)를 매깁니다.
        </p>
        <ul className="space-y-2 text-zinc-700">
          {criteria.map((c) => (
            <li key={c.name}>
              <span className="font-medium text-zinc-900">{c.name}</span>
              <span className="text-zinc-600"> · {c.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <p className="font-semibold">AI 검토 안내</p>
        <p className="mt-1 text-sm">
          AI 검토 결과(분야, 평점, 심사평)는 참고용 초안입니다. 최종 심사는 담당자가 사람이 직접 합니다.
          응모자 이름과 연락처는 공개 화면에 표시되지 않습니다.
        </p>
      </section>
    </main>
  );
}
