import { Box, Flex, Image, Link } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Flex
      as="footer"
      color="#959595"
      fontSize="14px"
      justify="space-between"
      align="center"
      mx="24px"
      flexWrap="wrap"
    >
      <Box my="8px">
        17104 경기도 용인시 기흥구 덕영대로 1732, 경희대학교 국제캠퍼스 학생회관
        405호
      </Box>
      <Flex my="8px" gap="16px">
        <Link href="https://khu.ac.kr/" color="#959595" textDecoration="none">
          <Image
            src="https://khlug.org/images/khu.png"
            height="17px"
            verticalAlign="bottom"
            mr="4px"
            display="inline"
          />
          경희대학교
        </Link>
        <Link href="https://khlug.org/" color="#959595" textDecoration="none">
          <Image
            src="https://khlug.org/images/favicon.gif"
            height="17px"
            verticalAlign="bottom"
            mr="4px"
            display="inline"
          />
          쿠러그
        </Link>
      </Flex>
    </Flex>
  );
}
