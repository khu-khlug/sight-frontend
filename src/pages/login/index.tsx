import { Box, Input, Text, VStack } from "@chakra-ui/react";
import Button from "../../components/Button";
import Container from "../../components/Container";
import SimpleLogoLayout from "../../layouts/SimpleLogoLayout";
import styles from "./style.module.css";

export default function LoginPage() {
  return (
    <SimpleLogoLayout>
      <main className={styles["content"]}>
        <Container>
          <VStack as="form" gap={4} align="stretch">
            <Box>
              <Text fontWeight="medium" mb={2}>
                아이디
              </Text>
              <Input type="text" placeholder="아이디를 입력하세요" />
            </Box>

            <Box>
              <Text fontWeight="medium" mb={2}>
                비밀번호
              </Text>
              <Input type="password" placeholder="비밀번호를 입력하세요" />
            </Box>

            <Button type="submit">로그인</Button>
          </VStack>
        </Container>
      </main>
    </SimpleLogoLayout>
  );
}
