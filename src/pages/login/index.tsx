import { Box, Input, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/Button";
import Container from "../../components/Container";
import SimpleLogoLayout from "../../layouts/SimpleLogoLayout";
import styles from "./style.module.css";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectPath = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. CSRF 토큰 조회
      const csrfResponse = await axios.get<{ csrfToken: string }>(
        "https://khlug.org/csrf-token"
      );
      const csrfToken = csrfResponse.data.csrfToken;

      // 2. FormData로 로그인 요청
      const formData = new FormData();
      formData.append("_token", csrfToken);
      formData.append("name", username);
      formData.append("password", password);

      const loginResponse = await axios.post(
        "https://khlug.org/login",
        formData
      );

      // 3. 200대 응답이면 redirect
      if (loginResponse.status >= 200 && loginResponse.status < 300) {
        navigate(redirectPath);
      }
    } catch (error) {
      // 4. 에러 시 toast 표시
      toast.error("로그인 실패: 아이디 또는 비밀번호를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SimpleLogoLayout>
      <main className={styles["content"]}>
        <Container>
          <VStack as="form" onSubmit={handleSubmit} gap={4} align="stretch">
            <Box>
              <Text fontWeight="medium" mb={2}>
                아이디
              </Text>
              <Input
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Box>

            <Box>
              <Text fontWeight="medium" mb={2}>
                비밀번호
              </Text>
              <Input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Box>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </VStack>
        </Container>
      </main>
    </SimpleLogoLayout>
  );
}
