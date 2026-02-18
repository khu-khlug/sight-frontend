import { Box, Link } from "@chakra-ui/react";
import Callout from "../../../components/Callout";

export default function LegacySiteBanner() {
  return (
    <Box mt={4} mb={4}>
      <Callout type="warning">
        쿠러그의 새로운 메인 페이지에요. 이전 사이트로 가고 싶다면{" "}
        <Link
          href="https://khlug.org"
          color="orange.600"
          fontWeight="bold"
          target="_blank"
        >
          여기
        </Link>
        를 눌러주세요.
      </Callout>
    </Box>
  );
}
