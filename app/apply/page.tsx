import ApplyForm from "./ApplyForm";

export default function ApplyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold">응모하기</h1>
      <p className="mt-2 text-sm text-zinc-600">
        아래 항목을 모두 입력하고 개인정보 동의에 체크해 주세요. 응모 내용은 AI 검토 초안 작성에 사용됩니다.
      </p>
      <ApplyForm />
    </main>
  );
}
