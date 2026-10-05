import { useNavigate } from "react-router-dom";
import { Box, Flex, Button } from "@chakra-ui/react";
import Container from "../../../components/Container";
import BrandButton from "../../../components/Button";
import "./style.css";

type Props = {
  current?: "list" | "borrow" | "return" | "my" | "manage";
};

function NavTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return active ? (
    <BrandButton flex={1} size="sm" variant="primary" onClick={onClick}
    >
      {children}
    </BrandButton>
  ) : (
    <Button flex={1} size="sm" variant="ghost" onClick={onClick}>
      {children}
    </Button>
  );
}

export default function BookNavBar({ current }: Props) {
  const navigate = useNavigate();

  return (
    <Box mt={6}>
      <Container className="book-nav-bar">
        <Flex>
          <NavTab active={current === "list"} onClick={() => navigate("/book")}>
            도서 목록
          </NavTab>
          <NavTab
            active={current === "borrow"}
            onClick={() => navigate("/book/scan?action=borrow")}
          >
            대출하기
          </NavTab>
          <NavTab
            active={current === "return"}
            onClick={() => navigate("/book/scan?action=return")}
          >
            반납하기
          </NavTab>
          <NavTab active={current === "my"} onClick={() => navigate("/book/my")}>
            내 대출
          </NavTab>
        </Flex>
      </Container>
    </Box>
  );
}
