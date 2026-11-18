import { Box, Input, Link, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import legacyClient, { LEGACY_SITE_URL } from "../../api/client/legacy";
import Button from "../../components/Button";
import Container from "../../components/Container";
import SimpleLogoLayout from "../../layouts/SimpleLogoLayout";
import { getSafeInternalRedirectPath } from "../../util/redirect";
import styles from "./style.module.css";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [csrfToken, setCsrfToken] = useState("");

  const redirectPath = getSafeInternalRedirectPath(searchParams.get("redirect"));

  useEffect(() => {
    legacyClient
      .get<{ csrfToken: string }>("/csrf-token")
      .then((res) => setCsrfToken(res.data.csrfToken));
  }, []);

  return (
    <SimpleLogoLayout>
      <main className={styles["content"]}>
        <Container>
          <form method="POST" action={`${LEGACY_SITE_URL}/login`}>
            <VStack gap={4} align="stretch">
              <input type="hidden" name="_token" value={csrfToken} />
              <input type="hidden" name="redirectTo" value={redirectPath} />

              <Box>
                <Text fontWeight="medium" mb={2}>
                  아이디
                </Text>
                <Input
                  type="text"
                  name="name"
                  placeholder="아이디를 입력하세요"
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  비밀번호
                </Text>
                <Input
                  type="password"
                  name="password"
                  placeholder="비밀번호를 입력하세요"
                />
              </Box>

              <Link
                href="https://khlug.org/password/reset"
                alignSelf="flex-start"
                fontSize="sm"
              >
                비밀번호를 잊으셨나요?
              </Link>

              <Button type="submit" disabled={!csrfToken}>
                {!csrfToken ? "로딩 중..." : "로그인"}
              </Button>
            </VStack>
          </form>
        </Container>
      </main>
    </SimpleLogoLayout>
  );
}
