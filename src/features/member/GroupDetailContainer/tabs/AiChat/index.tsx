import { Box, Link, Text } from "@chakra-ui/react";
import styles from "./style.module.css";

export default function AiChat() {

  return (
    <Box className={styles.container}>
      <Box className={styles.introduction}>
        <Text className={styles.status}>이 탭은 아직 구현되지 않았습니다.</Text>
        <Text className={styles.headline}>AI 챗봇 서비스 개발 경험을 여러분의 포트폴리오에 추가해보세요!</Text>
        <Text className={styles.description}>쿠러그는 여러분의 기여를 환영합니다!</Text>
        <Box className={styles.links}>
          <Link className={styles.link} href="https://github.com/khu-khlug/sight-frontend">프런트</Link>
          <Link className={styles.link} href="https://github.com/khu-khlug/sight-spring-backend">백엔드</Link>
        </Box>
      </Box>
      <Box className={styles.reference}>
        <Text className={styles.memo}>memo:<br />챗쿠는 모든 경희대생에게 무료토큰이 있으니 먼저 연결해봐도 좋을듯</Text>
        <Box className={styles.links}>
          <Link className={styles.link} href="https://chat.khu.ac.kr/dashboard/developers">챗쿠</Link>
          <Link className={styles.link} href="https://docs.mindlogic.ai/docs/khu/api-gateway/getting-started/overview#api-gateway">챗쿠 문서</Link>
        </Box>
        <Text className={styles.note}>다만 언제 갑자기 서비스 종료할수도 있다는점을 고려해야함</Text>
        <Box className={styles.steps}>
          <Text className={styles.step}>1단계: 이 창을 통해 단순 대화만 가능</Text>
          <Text className={styles.step}>2단계: 쿠러그 MCP서버를 개발, 사용자가 프롬프팅하면 AI가 그룹 기록과 저장소 등을 읽어 문서화하고 디스코드 채팅을 읽어 회의록을 기록하는 등의 서비스 개발</Text>
        </Box>
      </Box>
    </Box>
  );
}
