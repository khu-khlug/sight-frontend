import { Box, Link } from "@chakra-ui/react";
import Callout from "../../../components/Callout";

export default function LegacySiteBanner() {
  return (
    <Box mt={4} mb={4}>
      <Callout type="warning">
        새로운 사이트입니다. 문제가 있다면{" "}
        <Link href="https://khlug.org" color="orange.600" fontWeight="bold" target="_blank">
          이전 사이트
        </Link>
        를 이용해주세요.
      </Callout>
    </Box>
  );
}
