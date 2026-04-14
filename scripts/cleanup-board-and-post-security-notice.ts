import db from "../lib/db";

const NOTICE_TITLE = "보안 취약점 보완 완료 안내";
const NOTICE_CONTENT = `이번 점검을 통해 사이트 전반의 주요 보안 취약점 보완 작업을 완료했습니다.

주요 보완 항목

- 게시글/댓글 수정 및 삭제 권한을 서버 기준으로 다시 검증하도록 정비
- 익명 게시글/댓글 비밀번호를 평문 저장에서 해시 저장 방식으로 전환
- 운영자 전용 기능과 알림 발송 API에 권한 검증 추가
- 구독/날씨/외부 데이터 연동 API 입력값 검증 및 요청 제한 강화
- Markdown 렌더링, iframe, 외부 링크 처리, 서비스워커 이동 URL 보안 강화
- 세션 쿠키 보안 옵션과 기본 보안 헤더(CSP, X-Frame-Options 등) 적용

이번 반영으로 확인된 고위험 취약점은 우선 조치가 끝났으며, 추가 점검과 운영 환경 보강도 계속 진행하겠습니다.`;

async function main() {
  const operatorIds = process.env.OPERATORS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!operatorIds || operatorIds.length === 0) {
    throw new Error(
      "OPERATORS 환경변수가 필요합니다. 공지 작성자 운영자 계정을 식별할 수 없습니다."
    );
  }

  const author = await db.user.findFirst({
    where: {
      id: {
        in: operatorIds,
      },
    },
    select: {
      idx: true,
      nickname: true,
      id: true,
    },
  });

  if (!author) {
    throw new Error("OPERATORS에 해당하는 작성자 계정을 찾지 못했습니다.");
  }

  const deletedBoardPosts = await db.post.deleteMany({
    where: {
      category: "board",
    },
  });

  await db.post.deleteMany({
    where: {
      category: "technote",
      title: NOTICE_TITLE,
    },
  });

  const notice = await db.post.create({
    data: {
      category: "technote",
      title: NOTICE_TITLE,
      content: NOTICE_CONTENT,
      user: {
        connect: {
          idx: author.idx,
        },
      },
    },
    select: {
      idx: true,
      title: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        deletedBoardPosts: deletedBoardPosts.count,
        technoteNotice: notice,
        author: {
          idx: author.idx,
          id: author.id,
          nickname: author.nickname,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Failed to clean up board posts and create the notice:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
