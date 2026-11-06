// 분야 코드와 한글 표시명. 화면과 서버가 함께 쓰므로 서버 전용 코드(환경변수, 외부 호출)를 두지 않는다.
// Airtable ai_field 단일 선택지와 글자까지 같아야 한다.

export const FIELD_CODES = ["DETECT", "EDU", "POLICY", "SPREAD"] as const;
export type FieldCode = (typeof FIELD_CODES)[number];

export const FIELD_LABELS: Record<FieldCode, string> = {
  DETECT: "탐지·검증 기술",
  EDU: "교육·미디어 리터러시",
  POLICY: "제도·정책",
  SPREAD: "확산 차단·커뮤니티",
};
