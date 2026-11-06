// 응모 입력 검사 규칙. 화면(ApplyForm)과 서버 API(F3)가 같은 규칙을 공유한다.
// 기준은 서버 검사다. 화면 검사는 입력 편의용이다.

export type ApplicationInput = {
  team_name: string;
  members: string;
  idea_title: string;
  idea_summary: string;
  expected_effect: string;
  phone: string;
  email: string;
  consent: boolean;
};

export type ApplicationErrors = Partial<Record<keyof ApplicationInput, string>>;

export const EMPTY_APPLICATION: ApplicationInput = {
  team_name: "",
  members: "",
  idea_title: "",
  idea_summary: "",
  expected_effect: "",
  phone: "",
  email: "",
  consent: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9-]+$/;

function lengthMessage(label: string, min: number, max: number) {
  return `${label}은(는) ${min}자 이상 ${max}자 이하로 입력해 주세요.`;
}

export function validateApplication(input: ApplicationInput): ApplicationErrors {
  const errors: ApplicationErrors = {};

  const team = input.team_name.trim();
  if (team.length < 1 || team.length > 30) {
    errors.team_name = lengthMessage("팀명", 1, 30);
  }

  const members = input.members.trim();
  if (members.length < 1 || members.length > 100) {
    errors.members = lengthMessage("구성원", 1, 100);
  } else if (
    members
      .split(",")
      .map((m) => m.trim())
      .some((m) => m.length === 0)
  ) {
    errors.members = "구성원은 이름을 쉼표로 구분해 적어 주세요. 빈 이름이 있습니다.";
  }

  const title = input.idea_title.trim();
  if (title.length < 1 || title.length > 60) {
    errors.idea_title = lengthMessage("아이디어 제목", 1, 60);
  }

  const summary = input.idea_summary.trim();
  if (summary.length < 10 || summary.length > 1000) {
    errors.idea_summary = lengthMessage("아이디어 요약", 10, 1000);
  }

  const effect = input.expected_effect.trim();
  if (effect.length < 10 || effect.length > 500) {
    errors.expected_effect = lengthMessage("기대 효과", 10, 500);
  }

  const phone = input.phone.trim();
  if (phone.length < 9 || phone.length > 13 || !PHONE_RE.test(phone)) {
    errors.phone = "전화번호는 숫자와 하이픈(-)만 써서 9~13자로 입력해 주세요.";
  }

  const email = input.email.trim();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    errors.email = "메일 형식이 올바르지 않습니다. 예: name@example.com";
  }

  if (!input.consent) {
    errors.consent = "개인정보 수집·이용에 동의해야 접수할 수 있습니다.";
  }

  return errors;
}

export function hasErrors(errors: ApplicationErrors): boolean {
  return Object.keys(errors).length > 0;
}
