/**
 * 접수 확인 메일 자동 발송 (Airtable 웹훅 -> GAS 웹앱)
 *
 * 규칙 (세팅 주의사항 v2 기준)
 * - doPost는 정상 처리 시 아무것도 반환하지 않는다 (200). 반환하면 302가 나가 Airtable이 실패로 본다.
 * - 오류일 때만 일부러 응답을 반환해 Airtable이 재시도하게 한다.
 * - 중복 방지: sent_at(발송일시) 값이 있으면 건너뛴다.
 * - 신호에는 내용이 없으므로 "아직 발송 안 된 레코드 전체"를 조회해 처리한다.
 *
 * 스크립트 속성(프로젝트 설정 > 스크립트 속성)에 넣을 값
 * - AIRTABLE_TOKEN      : Airtable 토큰 (data.records:read, data.records:write)
 * - AIRTABLE_BASE_ID    : appcn4Gc1CQ8tRnYk
 * - AIRTABLE_TABLE_ID   : tblpDWAL2TeekfUTH
 * - WEBHOOK_KEY         : 웹앱 열쇠 문자열 (직접 정한 임의 값)
 * - WEBHOOK_ID          : 웹훅 등록 후 채움 (유지관리 트리거가 연장할 때 사용)
 */

var MAIL_SENDER_NAME = "허위정보 대응 대학생 아이디어 공모전";
var MAIL_SUBJECT = "[공모전] 응모 접수가 완료되었습니다";

function props_() {
  return PropertiesService.getScriptProperties();
}

function airtableUrl_(path) {
  return "https://api.airtable.com/v0/" + props_().getProperty("AIRTABLE_BASE_ID") + "/" +
    props_().getProperty("AIRTABLE_TABLE_ID") + (path || "");
}

function airtableHeaders_() {
  return { Authorization: "Bearer " + props_().getProperty("AIRTABLE_TOKEN") };
}

// Airtable 웹훅이 호출하는 진입점.
function doPost(e) {
  var key = e && e.parameter ? e.parameter.key : "";
  if (!key || key !== props_().getProperty("WEBHOOK_KEY")) {
    // 열쇠가 틀리면 처리하지 않는다. 응답을 반환해 실패로 남긴다.
    return ContentService.createTextOutput("forbidden");
  }
  try {
    processPending_();
    // 정상 처리: 아무것도 반환하지 않는다 (200).
  } catch (err) {
    console.error("doPost 오류: " + err);
    // 일시 장애일 가능성이 있으므로 반환해서 Airtable 재시도를 유도한다.
    return ContentService.createTextOutput("retry");
  }
}

// 하루 1회 시간 트리거에서 호출: 웹훅 연장 + 미발송 건 보완 처리.
function dailyMaintenance() {
  refreshWebhook_();
  processPending_();
}

// 미발송 건을 모두 찾아 메일을 보낸다. 동시 실행을 막기 위해 락을 건다.
function processPending_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var pending = fetchPending_();
    for (var i = 0; i < pending.length; i++) {
      sendOne_(pending[i]);
    }
  } finally {
    lock.releaseLock();
  }
}

function fetchPending_() {
  var formula = "AND({sent_at}=BLANK(),{email}!='')";
  var out = [];
  var offset = "";
  do {
    var url = airtableUrl_("?filterByFormula=" + encodeURIComponent(formula) +
      "&fields%5B%5D=team_name&fields%5B%5D=idea_title&fields%5B%5D=email&fields%5B%5D=sent_at" +
      (offset ? "&offset=" + encodeURIComponent(offset) : ""));
    var res = UrlFetchApp.fetch(url, { headers: airtableHeaders_(), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) {
      throw new Error("Airtable 조회 실패 status=" + res.getResponseCode());
    }
    var data = JSON.parse(res.getContentText());
    out = out.concat(data.records || []);
    offset = data.offset || "";
  } while (offset);
  return out;
}

function sendOne_(rec) {
  // 중복 방지: 조회 후에도 한 번 더 확인.
  if (rec.fields.sent_at) return;

  var email = rec.fields.email;
  var teamName = rec.fields.team_name || "";
  var ideaTitle = rec.fields.idea_title || "";

  var body =
    "안녕하세요. 허위정보 대응 대학생 아이디어 공모전에 응모해 주셔서 감사합니다.\n\n" +
    "아래 내용으로 접수가 완료되었습니다.\n" +
    "- 팀명: " + teamName + "\n" +
    "- 아이디어 제목: " + ideaTitle + "\n\n" +
    "접수 기간: 2026년 11월 6일 ~ 12월 20일\n" +
    "심사 결과는 담당자 검토 후 이 메일 주소로 안내드립니다.\n" +
    "(AI 검토 결과는 참고용 초안이며, 최종 심사는 담당자가 합니다.)\n\n" +
    "본 메일은 발신 전용입니다. 문의는 공모전 담당자에게 주세요.";

  try {
    MailApp.sendEmail({ to: email, subject: MAIL_SUBJECT, body: body, name: MAIL_SENDER_NAME });
  } catch (err) {
    // 발송 실패 건은 sent_at을 남기지 않는다. 다음 보완 처리 때 다시 시도된다.
    console.error("메일 발송 실패 recordId=" + rec.id + " : " + err);
    return;
  }
  markSent_(rec.id);
}

function markSent_(recordId) {
  var res = UrlFetchApp.fetch(airtableUrl_("/" + recordId), {
    method: "patch",
    contentType: "application/json",
    headers: airtableHeaders_(),
    payload: JSON.stringify({ fields: { sent_at: new Date().toISOString() } }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    console.error("sent_at 기록 실패 recordId=" + recordId + " status=" + res.getResponseCode());
  }
}

// 웹훅 7일 만료 방지. 연장하면 그 시점부터 다시 7일이 된다.
function refreshWebhook_() {
  var webhookId = props_().getProperty("WEBHOOK_ID");
  if (!webhookId) {
    console.error("WEBHOOK_ID가 없어 연장하지 않았습니다.");
    return;
  }
  var base = props_().getProperty("AIRTABLE_BASE_ID");
  var res = UrlFetchApp.fetch(
    "https://api.airtable.com/v0/bases/" + base + "/webhooks/" + webhookId + "/refresh",
    { method: "post", headers: airtableHeaders_(), muteHttpExceptions: true }
  );
  if (res.getResponseCode() !== 200) {
    console.error("웹훅 연장 실패 status=" + res.getResponseCode());
  }
}
