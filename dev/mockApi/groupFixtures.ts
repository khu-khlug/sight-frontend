import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroupCategory, GroupInterest, GroupStatus, GroupVisibility } from "../../src/constant";
import type { GroupInfoDto } from "../../src/api/public/group/types";
// 목업 서버 내부의 그룹 상태. 그룹장은 회원 아이디로 들고, 요청자 기준 값(isLeader 등)은 응답할 때 계산한다.
export type GroupInfo = Omit<GroupInfoDto, "isLeader"> & { leaderUserId: number; archivedCardCount: number; savedRecordCount: number };
import type { GroupMemberDto as GroupMember } from "../../src/api/public/group/GroupMemberListApi";
// 목업은 레거시처럼 완성 문장으로 로그를 들고, 응답할 때 LEGACY 로그로 내려준다.
export type ActivityLogEntry = { id: string; memberName: string; message: string; createdAt: string };
import type { ArchivedCardDto as ArchivedCard, SavedRecordDto as SavedRecord } from "../../src/api/public/group/GroupArchiveApi";
import type { ChatMessageDto as ChatMessage } from "../../src/api/public/group/GroupChatApi";
import type { ActivityReportDto as ActivityReport, OpenSeminarCohortDto as OpenSeminarCohort } from "../../src/api/public/group/GroupExposureApi";
import type { CardLabelDto as LabelColor } from "../../src/api/public/group/KanbanApi";
import { legacyRecordAttachments, legacyRecordContent } from "./legacyRecordContent";
import { nextMockIntegerId } from "./integerId";
export const MOCK_OTHER_GROUP_ID = "906558544281600001";
export const nextMockRecordId = nextMockIntegerId;
export interface MockRecord { type: "tiptap" | "legacy"; id: string; authorName: string; authorUserId: number; content: string; createdAt: string; updatedAt: string; deleted: boolean; isInPortfolio?: boolean; files?: MockRecordFile[] }
// 기록 본문이 참조하는 첨부 파일. fileId는 uploads 맵의 키다.
export type MockRecordFile = { id: string; fileId: string; name: string; size: number; contentType: string }
export interface MockCard { id: string; title: string; description: string; portfolio: boolean; authorName: string; authorUserId: number; assigneeName: string | null; assigneeUserId: number | null; inheritedFrom: string | null; coverImageUrl: string | null; labels: LabelColor[]; disabled: boolean; createdAt: string; records: MockRecord[]; recordSort?: "NEWEST" | "OLDEST" | "RECENTLY_UPDATED" }
export interface MockList { id: string; title: string; description: string; cards: MockCard[] }
// 표시·이동 흐름용 예시이며 실제 Discord 채널이 아니다.
export const MOCK_CHAT_ROOM_URL = "https://discord.com/channels/1343604778059694122/1343604778059694123";
const dummyGroupInfo: GroupInfo = {
  id: "1",
  title: "SIGHT 리뉴얼 프로젝트",
  category: GroupCategory.PROJECT,
  status: GroupStatus.PROGRESS,
  visibility: GroupVisibility.MEMBER_ONLY,
  leaderUserId: 1,
  isMember: true,
  hasChatRoom: true,
  chatRoomUrl: MOCK_CHAT_ROOM_URL,
  isChatParticipant: true,
  isBookmarked: true,
  memberCount: 6,
  description: "동아리 사이트를 새 디자인으로 다시 만드는 그룹입니다.",
  interests: [
    GroupInterest.WEB_APP_SERVICE,
    GroupInterest.UX_UI_DESIGN,
    GroupInterest.AI_DATA_SCIENCE,
    GroupInterest.NETWORK_CLOUD,
    GroupInterest.SECURITY_HACKING,
  ],
  techStack: ["react", "typescript", "springboot"],
  allowJoin: true,
  repositoryUrls: [
    "https://github.com/khu-khlug/sight-frontend",
    "https://github.com/khu-khlug/sight-spring-backend",
  ],
  hasPublishedPortfolio: false,
  specialOrganizations: [], // specialOrganizations: [SpecialOrganization.SECURITY_HACKING_TRACK],
  portfolioListCount: 0, portfolioCardCount: 0, archivedCardCount: 0, savedRecordCount: 0,
  listCount: 8,
  cardCount: 42,
  recordCount: 130,
  seminarCount: 5,
  reportCount: 12,
  createdAt: "2026-03-02T00:00:00Z",
  lastActivityAt: "2026-09-20T09:00:00Z",
};

const dummyMembers: GroupMember[] = [
  { userId: 1, name: "김리더", college: "소프트웨어융합대학", isLeader: true, cardCount: 12, recordCount: 30 },
  { userId: 3, name: "이코드", college: "공과대학", isLeader: false, cardCount: 8, recordCount: 15 },
  { userId: 4, name: "박디자인", college: "예술·디자인대학", isLeader: false, cardCount: 5, recordCount: 9 },
  { userId: 5, name: "최기획", college: "경영대학", isLeader: false, cardCount: 3, recordCount: 4 },
  { userId: 6, name: "정테스트", college: "전자정보대학", isLeader: false, cardCount: 6, recordCount: 11 },
  { userId: 7, name: "한신입", college: "국제대학", isLeader: false, cardCount: 1, recordCount: 2 },

];

const dummyArchivedCards: ArchivedCard[] = [
  {
    id: "100001",
    title: "구 로그인 페이지 리디자인",
    authorName: "이코드",
    recordCount: 4,
    createdAt: "2026-09-10T13:20:00Z",
    deletedAt: "2026-09-28T13:20:00Z",
  },
  {
    id: "100002",
    title: "Redis 캐시 도입 검토",
    authorName: "김리더",
    recordCount: 2,
    createdAt: "2026-08-22T09:00:00Z",
    deletedAt: "2026-09-29T09:00:00Z",
  },
  {
    id: "100003",
    title: "다크 모드 시안",
    authorName: "박디자인",
    recordCount: 6,
    createdAt: "2026-07-15T18:45:00Z",
    deletedAt: "2026-09-27T18:45:00Z",
  },
  ...Array.from({ length: 15 }, (_, index) => ({
    id: String(100004 + index),
    title: `이전 스프린트 작업 ${index + 1}`,
    authorName: dummyMembers[index % dummyMembers.length].name,
    recordCount: (index % 5) + 1,
    createdAt: new Date(Date.parse("2026-09-15T12:00:00Z") - index * 24 * 60 * 60 * 1000).toISOString(),
    deletedAt: new Date(Date.parse("2026-09-26T12:00:00Z") - index * 8 * 60 * 60 * 1000).toISOString(),
  })),
];

const SAVED_RECORD_CONTENTS = [
  "로그인 화면의 접근성 검토 결과를 정리했습니다. 키보드만으로 모든 입력 항목에 접근할 수 있는지 확인했고, 오류 메시지가 화면 읽기 프로그램에 제대로 전달되도록 수정했습니다. 다음 검토에서는 모바일 화면의 초점 이동 순서도 확인할 예정입니다.",
  "사용자 테스트에서 확인한 주요 피드백을 공유합니다. 첫 화면에서 원하는 기능을 찾는 데 시간이 오래 걸린다는 의견이 있었고, 메뉴 이름을 더 직관적으로 바꾸자는 제안이 나왔습니다. 수정 시안을 만든 뒤 같은 과제로 다시 테스트해 보겠습니다.",
  "이번 주 작업 진행 상황입니다. API 응답 형식과 화면 상태를 맞추고, 비어 있는 목록과 오류가 발생한 경우의 문구를 점검했습니다. 남은 작업은 로딩 상태를 정리하고 실제 데이터로 다시 검증하는 것입니다.",
  "디자인 리뷰에서 카드 간격과 텍스트 위계를 조정하기로 했습니다. 긴 제목과 여러 줄 설명이 함께 있을 때도 버튼이 밀리지 않도록 다양한 화면 크기에서 확인했습니다. 추가 의견이 있으면 다음 회의 전에 남겨 주세요.",
];

const dummySavedRecords: SavedRecord[] = Array.from({ length: 24 }, (_, index) => {
  const listIndex = index % 8;
  const cardIndex = index % ((listIndex % 4) + 3);
  return {
    groupId: index % 3 === 0 ? MOCK_OTHER_GROUP_ID : "1",
    groupName: index % 3 === 0 ? "다른 그룹 목업" : dummyGroupInfo.title,
    isDeleted: index === 1 || index === 3,
    isCardDeleted: index === 2 || index === 3,
    id: nextMockRecordId(),
    type: "tiptap" as const,
    content: SAVED_RECORD_CONTENTS[index % SAVED_RECORD_CONTENTS.length],
    cardId: `${listIndex + 1}-${cardIndex + 1}`,
    cardTitle: `리스트 ${listIndex + 1} 카드 ${cardIndex + 1}`,
    authorName: dummyMembers[index % dummyMembers.length].name,
    createdAt: new Date(Date.parse("2026-09-26T12:00:00Z") - index * 8 * 60 * 60 * 1000).toISOString(),
    savedAt: new Date(Date.parse("2026-09-28T12:00:00Z") - index * 4 * 60 * 60 * 1000).toISOString(),
  };
});

const ACTIVITY_MESSAGES = [
  (name: string) => `${name}님이 카드를 추가했습니다.`,
  (name: string) => `${name}님이 기록을 작성했습니다.`,
  (name: string) => `${name}님이 카드를 이동했습니다.`,
  (name: string) => `${name}님이 카드를 아카이브했습니다.`,
  (name: string) => `${name}님이 세미나를 등록했습니다.`,
];

const dummyActivityLogs: ActivityLogEntry[] = Array.from({ length: 24 }, (_, index) => {
  const member = dummyMembers[index % dummyMembers.length];
  const message = ACTIVITY_MESSAGES[index % ACTIVITY_MESSAGES.length](member.name);
  const createdAt = new Date(Date.parse("2026-09-25T12:00:00Z") - index * 3 * 60 * 60 * 1000).toISOString();

  return {
    id: nextMockIntegerId(),
    memberName: member.name,
    message,
    createdAt,
  };
});

const CHAT_MESSAGES = [
  "다들 안녕하세요!",
  "오늘 오후 8시에 회의 있는 거 다들 아시죠?",
  "네 알고 있습니다",
  "저는 조금 늦을 것 같아요, 10분 정도",
  "넵 괜찮습니다",
  "회의록은 제가 정리해서 올릴게요",
  "감사합니다 :)",
  "다음 스프린트 계획도 같이 얘기해요",
  "좋아요",
  "그럼 이따 뵙겠습니다",
  "넵!",
  "회의실 링크 다시 공유해주세요",
];

const chatImageData = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "assets", "kanban-cover-demo.svg"));
const chatTextData = Buffer.from("SIGHT 회의록\n- 화면 설계 시안 검토\n- 다음 스프린트 일정 논의\n", "utf8");
const chatImageAttachment = {
  name: "화면 설계 시안.svg", contentType: "image/svg+xml", size: chatImageData.length,
  url: `data:image/svg+xml;base64,${chatImageData.toString("base64")}`,
};
const chatFileAttachment = {
  name: "스프린트 회의록.txt", contentType: "text/plain", size: chatTextData.length,
  url: `data:text/plain;charset=utf-8;base64,${chatTextData.toString("base64")}`,
};

// 50개 단위 조회의 마지막 페이지와 날짜 경계를 포함하며 각 구간에 첨부 메시지를 둔다.
const dummyChatMessages: ChatMessage[] = Array.from({ length: 125 }, (_, index) => {
  const sample = index % 25;
  const attachments = sample === 19 || sample === 24 ? [chatImageAttachment]
    : sample === 20 ? [chatFileAttachment]
    : sample === 21 ? [chatImageAttachment, chatFileAttachment] : [];
  const content = sample === 24 ? ""
    : sample === 19 ? "화면 설계 시안을 공유합니다."
    : sample === 20 ? "스프린트 회의록을 첨부합니다."
    : sample === 21 ? "시안과 회의록을 함께 확인해주세요."
    : CHAT_MESSAGES[index % CHAT_MESSAGES.length];
  const member = dummyMembers[index % dummyMembers.length];
  const createdAt = new Date(
    Date.parse("2026-09-25T20:00:00Z") + index * 30 * 60 * 1000,
  ).toISOString();

  return {
    id: String(index + 1),
    authorName: member.name,
    content,
    createdAt,
    attachments,
  };
});

// 카드 상세 창의 세로 스크롤 확인용 — 긴 기록 여러 개를 한 카드에 몰아서 content.textViewerRoot
// 수준으로 넘치게 만든다(리스트1 카드2/카드3 전용, 나머지 카드는 기존 2개짜리 짧은 기록 유지).
const LONG_RECORD_PARAGRAPHS = [
  "오늘 스프린트 회고를 진행했습니다. 지난 2주간 칸반 보드 드래그 앤 드롭 성능 이슈를 집중적으로 다뤘고, 가상 스크롤 적용 전후로 카드 500개 기준 프레임 드랍이 어느 정도 줄었는지 측정했습니다. 측정 결과는 별도 문서에 정리해서 공유 드라이브에 올려두었으니 참고 부탁드립니다. 다음 스프린트에는 가로 스크롤 영역까지 포함해서 한 번 더 측정할 예정입니다.",
  "디자인 쪽에서 카드 헤더의 라벨 점 크기를 2px 키우자는 의견이 나와서 반영했습니다. 모바일 환경에서 터치 영역이 너무 작다는 피드백이 반복적으로 들어왔던 부분이라 우선순위를 높여서 처리했고, 실기기 테스트까지 마쳤습니다. 다만 듀얼 모드에서는 여전히 간격이 좁아 보여서 추가 조정이 필요할 것 같습니다.",
  "백엔드 쪽 API 응답 스키마가 변경되어서 프론트 타입 정의를 전부 다시 맞췄습니다. recordCount 필드가 서버 계산 값으로 바뀌면서 클라이언트에서 직접 세던 로직을 제거했는데, 이 과정에서 몇몇 화면이 숫자를 0으로 잘못 표시하는 회귀가 있어 같이 수정했습니다. 관련 커밋은 PR #482에 모아뒀습니다.",
  "그룹장님과 1:1로 이번 분기 로드맵을 다시 검토했습니다. 당초 계획했던 채팅 기능 고도화는 다음 분기로 미루고, 대신 칸반 보드의 검색/필터 기능을 먼저 끝내기로 했습니다. 우선순위 변경에 따른 일정 재조정 문서를 이번 주 안에 공유드리겠습니다.",
  "QA 과정에서 발견된 버그 목록을 정리했습니다. 특히 카드 설명을 편집하다가 다른 카드로 포커스를 옮기면 임시 저장 없이 입력 내용이 날아가는 문제가 재현됐는데, 이건 심각도가 높아서 이번 주 내로 핫픽스를 내보낼 계획입니다. 나머지는 다음 정기 배포에 포함하겠습니다.",
  "신규 합류한 팀원 온보딩을 진행했습니다. 코드베이스 구조와 컨벤션 문서를 같이 훑어봤고, 첫 태스크로 작은 UI 버그 하나를 배정했습니다. 질문이 많았던 부분은 WindowLayer의 듀얼 모드 슬롯 상태 관리였는데, 다이어그램을 하나 더 그려서 문서에 추가하기로 했습니다.",
];

// 에디터가 지원하는 블록·마크를 한 번씩 전부 담은 기록(Tiptap JSON 형식) — 드래그 핸들 등
// 블록 단위 동작을 확인하는 용도라 리스트1 카드2에만 둔다. 오디오·유튜브는 외부 주소라 오프라인에선 안 뜬다.
const ALL_ELEMENTS_RECORD_JSON = JSON.stringify({
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {
        "level": 1
      },
      "content": [
        {
          "type": "text",
          "text": "제목 1"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {
        "level": 2
      },
      "content": [
        {
          "type": "text",
          "text": "제목 2"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {
        "level": 3
      },
      "content": [
        {
          "type": "text",
          "text": "제목 3"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {
        "level": 4
      },
      "content": [
        {
          "type": "text",
          "text": "제목 4"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {
        "level": 5
      },
      "content": [
        {
          "type": "text",
          "text": "제목 5"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {
        "level": 6
      },
      "content": [
        {
          "type": "text",
          "text": "제목 6"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "일반 문단입니다. "
        },
        {
          "type": "text",
          "text": "굵게",
          "marks": [
            {
              "type": "bold"
            }
          ]
        },
        {
          "type": "text",
          "text": ", "
        },
        {
          "type": "text",
          "text": "기울임",
          "marks": [
            {
              "type": "italic"
            }
          ]
        },
        {
          "type": "text",
          "text": ", "
        },
        {
          "type": "text",
          "text": "밑줄",
          "marks": [
            {
              "type": "underline"
            }
          ]
        },
        {
          "type": "text",
          "text": ", "
        },
        {
          "type": "text",
          "text": "취소선",
          "marks": [
            {
              "type": "strike"
            }
          ]
        },
        {
          "type": "text",
          "text": ", "
        },
        {
          "type": "text",
          "text": "하이라이트",
          "marks": [
            {
              "type": "highlight"
            }
          ]
        },
        {
          "type": "text",
          "text": ", "
        },
        {
          "type": "text",
          "text": "인라인 코드",
          "marks": [
            {
              "type": "code"
            }
          ]
        },
        {
          "type": "text",
          "text": ", 위첨자 x"
        },
        {
          "type": "text",
          "text": "2",
          "marks": [
            {
              "type": "superscript"
            }
          ]
        },
        {
          "type": "text",
          "text": ", 아래첨자 H"
        },
        {
          "type": "text",
          "text": "2",
          "marks": [
            {
              "type": "subscript"
            }
          ]
        },
        {
          "type": "text",
          "text": "O, "
        },
        {
          "type": "text",
          "text": "링크",
          "marks": [
            {
              "type": "link",
              "attrs": {
                "href": "https://example.com"
              }
            }
          ]
        },
        {
          "type": "text",
          "text": ", "
        },
        {
          "type": "text",
          "text": "글자색",
          "marks": [
            {
              "type": "textStyle",
              "attrs": {
                "color": "#e03131"
              }
            }
          ]
        },
        {
          "type": "text",
          "text": ", "
        },
        {
          "type": "text",
          "text": "배경색",
          "marks": [
            {
              "type": "textStyle",
              "attrs": {
                "backgroundColor": "#ffec99"
              }
            }
          ]
        },
        {
          "type": "text",
          "text": ", 인라인 수식 "
        },
        {
          "type": "inlineMath",
          "attrs": {
            "latex": "E=mc^2"
          }
        },
        {
          "type": "text",
          "text": " 를 한 줄에 담았습니다."
        }
      ]
    },
    {
      "type": "paragraph",
      "attrs": {
        "textAlign": "center"
      },
      "content": [
        {
          "type": "text",
          "text": "가운데 정렬 문단"
        }
      ]
    },
    {
      "type": "paragraph",
      "attrs": {
        "textAlign": "right"
      },
      "content": [
        {
          "type": "text",
          "text": "오른쪽 정렬 문단"
        }
      ]
    },
    {
      "type": "paragraph",
      "attrs": {
        "textAlign": "justify"
      },
      "content": [
        {
          "type": "text",
          "text": "양쪽 정렬 문단입니다. 줄이 길어져서 여러 줄로 넘어가야 정렬 차이가 보이므로 문장을 조금 길게 이어 씁니다. 줄이 길어져서 여러 줄로 넘어가야 정렬 차이가 보입니다."
        }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "글머리 목록 1"
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "글머리 목록 2"
                }
              ]
            },
            {
              "type": "bulletList",
              "content": [
                {
                  "type": "listItem",
                  "content": [
                    {
                      "type": "paragraph",
                      "content": [
                        {
                          "type": "text",
                          "text": "중첩 항목"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "orderedList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "순서 목록 1"
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "순서 목록 2"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "taskList",
      "content": [
        {
          "type": "taskItem",
          "attrs": {
            "checked": true
          },
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "완료한 할 일"
                }
              ]
            }
          ]
        },
        {
          "type": "taskItem",
          "attrs": {
            "checked": false
          },
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "남은 할 일"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "blockquote",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "인용문입니다."
            }
          ]
        },
        {
          "type": "blockquote",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "중첩 인용문입니다."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "details",
      "content": [
        {
          "type": "detailsSummary",
          "content": [
            {
              "type": "text",
              "text": "접는 블록 제목"
            }
          ]
        },
        {
          "type": "detailsContent",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "접는 블록 안의 본문입니다."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "codeBlock",
      "attrs": {
        "language": "typescript"
      },
      "content": [
        {
          "type": "text",
          "text": "const greet = (name: string) => `안녕하세요, ${name}님`;\nconsole.log(greet(\"sight\"));"
        }
      ]
    },
    {
      "type": "blockMath",
      "attrs": {
        "latex": "\\int_0^1 x^2\\,dx = \\frac{1}{3}"
      }
    },
    {
      "type": "horizontalRule"
    },
    {
      "type": "table",
      "content": [
        {
          "type": "tableRow",
          "content": [
            {
              "type": "tableHeader",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "이름"
                    }
                  ]
                }
              ]
            },
            {
              "type": "tableHeader",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "역할"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "tableRow",
          "content": [
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "홍길동"
                    }
                  ]
                }
              ]
            },
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "그룹장"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "tableRow",
          "content": [
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "김철수"
                    }
                  ]
                }
              ]
            },
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "멤버"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "image",
      "attrs": {
        "src": "/__mock-api/assets/kanban-cover-demo.svg",
        "alt": "이미지 예시"
      }
    },
    {
      "type": "audio",
      "attrs": {
        "src": "https://www.w3schools.com/html/horse.ogg"
      }
    },
    {
      "type": "youtube",
      "attrs": {
        "src": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "width": 640,
        "height": 360
      }
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "마지막 문단입니다."
        }
      ]
    }
  ]
});

function createLongMockRecords(listIndex: number, cardIndex: number, member: { name: string; userId: number }): MockRecord[] {
  const baseTime = Date.parse("2026-08-01T00:00:00Z") + (listIndex * 10 + cardIndex) * 86400000;
  // 리스트 1 카드 3은 카드 창 기록 이어 불러오기(10개 단위)를 확인할 수 있게 기록을 45개 둔다.
  const contents = listIndex === 0 && cardIndex === 1
    ? [ALL_ELEMENTS_RECORD_JSON, ...LONG_RECORD_PARAGRAPHS]
    : Array.from({ length: 45 }, (_, index) => `${index + 1}번째 기록. ${LONG_RECORD_PARAGRAPHS[index % LONG_RECORD_PARAGRAPHS.length]}`);
  return contents.map((content, index) => ({
    type: "tiptap" as const,
    id: nextMockRecordId(),
    authorName: member.name,
    authorUserId: member.userId,
    content,
    createdAt: new Date(baseTime + (index + 1) * 1000).toISOString(),
    updatedAt: new Date(baseTime + (index + 1) * 1000).toISOString(),
    deleted: false,
  }));
}

const LABEL_SETS: LabelColor[][] = [
  [],
  ["blue"],
  ["purple"],
  ["red", "yellow"],
  ["green"],
  ["gray"],
  ["lightGray", "black"],
];

// 레거시 카드 id는 리스트와 무관하게 단순 정수 카운터라, 목업도 "-" 없는 전역 일련번호로
// 맞춘다(URL 해시의 "type=value" 문법과 안 겹치려면 카드 id에 "=" 문자만 없으면 되지만,
// 실제 백엔드 형식을 그대로 흉내 내는 게 더 정확하다).
let mockCardIdCounter = 0;

// 자동 불러오기를 확인할 수 있게 리스트는 한 페이지(10개)보다 많이, 5번째마다 카드를 한 페이지(15개)보다 많이 둔다.
const dummyLists: MockList[] = Array.from({ length: 25 }, (_, listIndex) => ({
  id: String(listIndex + 1),
  title: `리스트 ${listIndex + 1}`,
  description: `리스트 ${listIndex + 1}에서 진행할 작업을 모아두는 공간입니다.`,
  cards: Array.from({ length: listIndex % 5 === 0 ? 40 : (listIndex % 4) + 3 }, (_, cardIndex) => {
    const member = dummyMembers[cardIndex % dummyMembers.length];
    mockCardIdCounter += 1;
    return {
      id: String(mockCardIdCounter),
      title: `리스트 ${listIndex + 1} 카드 ${cardIndex + 1}`,
      description: (listIndex + cardIndex) % 3 === 0 ? "작업 내용을 정리한 카드 설명입니다." : "",
      portfolio: (listIndex + cardIndex) % 2 === 0,
      authorName: member.name,
      authorUserId: member.userId,
      assigneeName: (listIndex + cardIndex) % 4 === 0 ? null : member.name,
      assigneeUserId: (listIndex + cardIndex) % 4 === 0 ? null : member.userId,
      inheritedFrom: (listIndex + cardIndex) % 5 === 1 ? "이전 카드" : null,
      coverImageUrl: listIndex === 0 && cardIndex === 1 ? "/__mock-api/assets/kanban-cover-demo.svg" : null,
      labels: LABEL_SETS[(listIndex + cardIndex) % LABEL_SETS.length],
      // 목업: 각 리스트의 첫 카드만 비활성화 상태로 둬서 어둡게 표시되는 걸 확인할 수 있게 한다.
      disabled: cardIndex === 0,
      createdAt: new Date(Date.parse("2026-08-01T00:00:00Z") + (listIndex * 10 + cardIndex) * 86400000).toISOString(),
      records: listIndex === 0 && (cardIndex === 1 || cardIndex === 2)
        ? createLongMockRecords(listIndex, cardIndex, member)
        : [
          {
            type: "tiptap" as const,
            id: nextMockRecordId(), authorName: member.name, authorUserId: member.userId,
            content: `${member.name}님이 진행 상황을 기록했습니다.`,
            createdAt: new Date(Date.parse("2026-08-01T00:00:00Z") + (listIndex * 10 + cardIndex) * 86400000 + 1000).toISOString(),
            updatedAt: new Date(Date.parse("2026-08-01T00:00:00Z") + (listIndex * 10 + cardIndex) * 86400000 + 1000).toISOString(),
            deleted: false,
          },
          {
            type: "tiptap" as const,
            id: nextMockRecordId(), authorName: member.name, authorUserId: member.userId,
            content: "리뷰 반영 완료.",
            createdAt: new Date(Date.parse("2026-08-01T00:00:00Z") + (listIndex * 10 + cardIndex) * 86400000 + 2000).toISOString(),
            updatedAt: new Date(Date.parse("2026-08-01T00:00:00Z") + (listIndex * 10 + cardIndex) * 86400000 + 2000).toISOString(),
            deleted: false,
          },
        ],
    };
  }),
}));

// 사이트에 올린 첨부 파일이 있는 기록. 목업 서버가 시작할 때 이 파일들을 업로드가 끝난 상태로 등록한다(groups.ts).
const MOCK_ATTACHMENT_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6XcAAAAASUVORK5CYII=";
const MOCK_ATTACHMENT_TEXT = "SIGHT 리뉴얼 회의록\n- 칸반 이어 불러오기 확인\n- 첨부 파일 보기 확인\n";
const byteLength = (text: string) => new TextEncoder().encode(text).length;
export const MOCK_UPLOADED_RECORD_FILES: (MockRecordFile & { data: string })[] = [
  { id: "f-mock-image", fileId: "mock-record-file-image", name: "화면 설계 시안.png", size: Buffer.byteLength(MOCK_ATTACHMENT_IMAGE, "base64"), contentType: "image/png", data: MOCK_ATTACHMENT_IMAGE },
  { id: "f-mock-text", fileId: "mock-record-file-text", name: "회의록.txt", size: byteLength(MOCK_ATTACHMENT_TEXT), contentType: "text/plain", data: MOCK_ATTACHMENT_TEXT },
];
{
  const card = dummyLists[0].cards[1];
  const createdAt = new Date(Date.parse(card.createdAt) + 60000).toISOString();
  const [image, textFile] = MOCK_UPLOADED_RECORD_FILES;
  card.records.push({
    type: "tiptap", id: nextMockRecordId(), authorName: card.authorName, authorUserId: card.authorUserId,
    content: JSON.stringify({ type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "사이트에 올린 첨부 파일이 있는 기록입니다." }] },
      { type: "image", attrs: { src: `/__mock-api/groups/1/files/${image.fileId}`, alt: image.name, recordFileId: image.id, fileId: image.fileId, width: 320, height: 160 } },
      { type: "fileAttachment", attrs: { src: `/__mock-api/groups/1/files/${textFile.fileId}`, name: textFile.name, size: textFile.size, contentType: textFile.contentType, recordFileId: textFile.id, fileId: textFile.fileId } },
      { type: "paragraph", content: [{ type: "text", text: "아래 이미지는 외부 주소라 첨부 파일 목록에 나오지 않습니다." }] },
      { type: "image", attrs: { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Public_domain_cat_photo_on_the_streets.jpg/960px-Public_domain_cat_photo_on_the_streets.jpg", alt: "외부 이미지" } },
    ] }),
    createdAt, updatedAt: createdAt, deleted: false,
    files: MOCK_UPLOADED_RECORD_FILES.map(({ data: _data, ...file }) => file),
  });
}

// 세미나 접수 기간은 그룹이 아니라 운영진이 클럽 전체 단위로 연다 — 지금은 열려있다고 가정.
const dummyOpenSeminarCohort: OpenSeminarCohort = {
  id: "seminar-2026-2",
  scheduledAt: "2026-12-05T10:00:00Z",
  endAt: "2026-12-05T14:00:00Z",
  isSummerSeason: false,
  isSpeakAfter: true,
};

const dummyActivityReports: ActivityReport[] = [
  {
    id: "s3",
    seminarId: "seminar-2026-2",
    seminarDate: "2026-12-05T10:00:00Z",
    seminarIsSummerSeason: false,
    seminarIsSpeakAfter: true,
    isPresentation: false,
    reportFileUrl: "/__mock-api/demo-files/활동보고서-2026-2.pdf",
    createdAt: "2026-09-25T10:00:00Z",
  },
  {
    id: "s1",
    seminarId: "seminar-2026-1",
    seminarDate: "2026-06-10T10:00:00Z",
    seminarIsSummerSeason: true,
    seminarIsSpeakAfter: false,
    isPresentation: true,
    reportFileUrl: "/__mock-api/demo-files/SIGHT-리뉴얼-발표자료.pdf",
    createdAt: "2026-06-10T10:00:00Z",
  },
  {
    id: "s2",
    seminarId: "seminar-2025-2",
    seminarDate: "2025-12-05T10:00:00Z",
    seminarIsSummerSeason: false,
    seminarIsSpeakAfter: true,
    isPresentation: false,
    reportFileUrl: "/__mock-api/demo-files/활동보고서-2025-2.pdf",
    createdAt: "2025-12-05T10:00:00Z",
  },
];

const initialGroupData = {
  groupInfo: dummyGroupInfo,
  members: dummyMembers,
  archivedCards: dummyArchivedCards,
  savedRecords: dummySavedRecords,
  activityLogs: dummyActivityLogs,
  chatMessages: dummyChatMessages,
  lists: dummyLists,
  openSeminarCohort: dummyOpenSeminarCohort,
  activityReports: dummyActivityReports,
};

export function createGroupFixture() {
  const data = structuredClone(initialGroupData);
  for (const [index, saved] of data.savedRecords.entries()) {
    const list = data.lists[index % 8];
    const card = list.cards[index % list.cards.length];
    saved.cardId = card.id;
    saved.cardTitle = card.title;
    const authorUserId = data.members.find((member) => member.name === saved.authorName)?.userId ?? 1;
    card?.records.push({
      id: saved.id, authorName: saved.authorName, authorUserId, content: saved.content,
      type: saved.type,
      createdAt: saved.createdAt, updatedAt: saved.createdAt, deleted: saved.isDeleted,
    });
  }
  // 제공받은 기록 #113908의 real_content 원문이다. 첫 카드에서 기존 Tiptap 기록과 함께 표시한다.
  data.lists[0].cards[0].records.push({
    type: "legacy", id: "113908", authorName: "구자웅", authorUserId: 1,
    content: `<h1>구상</h1>

<p>어떤 책들이 있는지 저장.</p>

<p>각 책들의 정보를 네이버 API로 긁어와 저장.</p>

<p>대출기록을 저장</p>`,
    createdAt: "2026-03-20T11:08:32+09:00", updatedAt: "2026-03-20T11:08:32+09:00", deleted: false,
  });
  data.lists[0].cards[0].records.push({
    type: "legacy", id: "118953", authorName: "구자웅", authorUserId: 1,
    content: `<div class="real_content">${legacyRecordContent}</div>${legacyRecordAttachments}`,
    createdAt: "2026-10-08T23:42:20+09:00", updatedAt: "2026-10-08T23:42:20+09:00", deleted: false,
  });
  const asJson = (content: string) => {
    try { if (JSON.parse(content).type === "doc") return content; } catch { /* 일반 텍스트 예시. */ }
    return JSON.stringify({ type: "doc", content: content.split(/\r?\n/).map((text) => ({ type: "paragraph", content: text ? [{ type: "text", text }] : [] })) });
  };
  for (const list of data.lists) for (const card of list.cards) for (const record of card.records) {
    if (record.type === "tiptap") record.content = asJson(record.content);
  }
  for (const saved of data.savedRecords) if (saved.type === "tiptap") saved.content = asJson(saved.content);
  const fileCard = data.lists[0].cards[1];
  const fileRecord = fileCard.records.find((record) => record.files?.length);
  if (fileRecord) data.savedRecords.unshift({ groupId: "1", groupName: data.groupInfo.title, isDeleted: false, isCardDeleted: false, id: fileRecord.id, type: fileRecord.type, content: fileRecord.content, cardId: fileCard.id, cardTitle: fileCard.title, authorName: fileRecord.authorName, createdAt: fileRecord.createdAt, savedAt: "2026-10-09T00:00:00Z" });
  return data;
}
