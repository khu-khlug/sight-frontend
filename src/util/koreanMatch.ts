const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;
const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
// 받침 번호(0은 받침 없음) → 같은 소리의 초성. 겹받침은 다음 글자로 넘어가는 뒤쪽 자음만 적는다.
const JONGSEONG_TO_CHOSEONG = [
  "", "ㄱ", "ㄲ", "ㅅ", "ㄴ", "ㅈ", "ㅎ", "ㄷ", "ㄹ", "ㄱ", "ㅁ", "ㅂ", "ㅅ", "ㅌ", "ㅍ", "ㅎ",
  "ㅁ", "ㅂ", "ㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

type Syllable = { cho: number; jung: number; jong: number };

function decompose(char: string | undefined): Syllable | null {
  if (!char) return null;
  const code = char.charCodeAt(0);
  if (code < SYLLABLE_START || code > SYLLABLE_END) return null;
  const offset = code - SYLLABLE_START;
  return { cho: Math.floor(offset / 588), jung: Math.floor((offset % 588) / 28), jong: offset % 28 };
}

/*
 * 입력한 글자 하나가 대상 글자 하나와 맞는지. 같은 글자 외에 아직 입력 중인 한글도 맞는 것으로 본다.
 * - 초성만 입력: "ㅊ"는 "체"와 맞는다.
 * - 받침 없이 입력: "모"는 "목"과 맞는다(받침을 치기 전).
 * - 마지막 글자에 받침이 붙은 채: "쳌"은 "체" + 다음 글자 "크"와 맞는다(다음 모음을 치면 받침이 다음 글자로 넘어간다).
 */
function charMatches(query: string, target: string, nextTarget: string | undefined, isLastQueryChar: boolean): boolean {
  if (query === target) return true;
  const choseong = CHOSEONG.indexOf(query);
  const t = decompose(target);
  if (choseong >= 0) return t?.cho === choseong;
  const q = decompose(query);
  if (!q || !t || q.cho !== t.cho || q.jung !== t.jung) return false;
  if (q.jong === 0) return true;
  if (q.jong === t.jong) return true;
  if (!isLastQueryChar) return false;
  const next = decompose(nextTarget);
  return t.jong === 0 && next?.cho === CHOSEONG.indexOf(JONGSEONG_TO_CHOSEONG[q.jong]);
}

function matchesAt(target: string, query: string, start: number): boolean {
  for (let index = 0; index < query.length; index += 1) {
    const position = start + index;
    if (position >= target.length) return false;
    if (!charMatches(query[index], target[position], target[position + 1], index === query.length - 1)) return false;
  }
  return true;
}

/*
 * 입력 순서대로 대상에 나타나는지 본다(띄엄띄엄이어도 된다). 맞으면 점수를, 아니면 null을 돌려준다.
 * 점수가 작을수록 잘 맞는다: 0 앞부분부터 연속으로 맞음, 1 중간에서 연속으로 맞음, 2 순서대로만 맞음.
 */
export function matchKorean(target: string, query: string): number | null {
  if (!query) return 0;
  if (matchesAt(target, query, 0)) return 0;
  for (let start = 1; start < target.length; start += 1) {
    if (matchesAt(target, query, start)) return 1;
  }
  let position = 0;
  for (let index = 0; index < query.length; index += 1) {
    const isLast = index === query.length - 1;
    while (position < target.length && !charMatches(query[index], target[position], target[position + 1], isLast)) position += 1;
    if (position >= target.length) return null;
    position += 1;
  }
  return 2;
}
