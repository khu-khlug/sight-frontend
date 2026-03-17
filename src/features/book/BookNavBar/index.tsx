import { useNavigate } from "react-router-dom";
import { Box, Flex, Button } from "@chakra-ui/react";
import Container from "../../../components/Container";
import "./style.css";

type Props = {
  current?: "list" | "borrow" | "return" | "my" | "manage";
};

export default function BookNavBar({ current }: Props) {
  const navigate = useNavigate();

  return (
    <Box mt={6}>
    <Container className="book-nav-bar">
      <Flex>
        <Button
          flex={1}
          size="sm"
          variant={current === "list" ? "solid" : "ghost"}
          colorScheme={current === "list" ? "blue" : undefined}
          onClick={() => navigate("/book")}
        >
          도서 목록
        </Button>
        <Button
          flex={1}
          size="sm"
          variant={current === "borrow" ? "solid" : "ghost"}
          colorScheme={current === "borrow" ? "blue" : undefined}
          onClick={() => navigate("/book/scan?action=borrow")}
        >
          대출
        </Button>
        <Button
          flex={1}
          size="sm"
          variant={current === "return" ? "solid" : "ghost"}
          colorScheme={current === "return" ? "blue" : undefined}
          onClick={() => navigate("/book/scan?action=return")}
        >
          반납
        </Button>
        <Button
          flex={1}
          size="sm"
          variant={current === "my" ? "solid" : "ghost"}
          colorScheme={current === "my" ? "blue" : undefined}
          onClick={() => navigate("/book/my")}
        >
          내 대출
        </Button>
      </Flex>
    </Container>
    </Box>
  );
}
