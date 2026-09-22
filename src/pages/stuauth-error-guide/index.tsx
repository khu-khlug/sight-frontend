import { Box } from "@chakra-ui/react";

export default function StuauthErrorGuidePage() {
  return (
    <Box
      as="main"
      maxW="768px"
      mx="auto"
      px={{ base: "5", md: "8" }}
      py={{ base: "8", md: "14" }}
      color="gray.700"
      fontSize={{ base: "15px", md: "16px" }}
      lineHeight="1.8"
      css={{
        "& h1": {
          marginBottom: "6",
          color: "gray.900",
          fontSize: { base: "26px", md: "34px" },
          fontWeight: "bold",
          lineHeight: "1.35",
          letterSpacing: "-0.03em",
          wordBreak: "keep-all",
          overflowWrap: "anywhere",
        },
        "& p": {
          marginBottom: "4",
          wordBreak: "keep-all",
          overflowWrap: "anywhere",
        },
        "& b": {
          color: "gray.900",
          fontWeight: "semibold",
        },
        "& a": {
          color: "brand.700",
          fontWeight: "medium",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          borderRadius: "2px",
          _hover: { color: "brand.800" },
          _focusVisible: {
            outline: "2px solid",
            outlineColor: "brand.600",
            outlineOffset: "3px",
          },
        },
        "& img": {
          display: "block",
          maxWidth: "100%",
          height: "auto",
          marginInline: "auto",
          marginTop: { base: "8", md: "10" },
          marginBottom: "5",
          border: "1px solid",
          borderColor: "gray.200",
          borderRadius: "lg",
        },
      }}
    >
      <h1>Stuauth 로그인 중 500 에러 해결 안내</h1>
      <p>
        본 페이지는 중앙동아리연합회 사이트에서{" "}
        <a href="https://jajudy.khu.ac.kr/stuauth">stuauth</a>를 통해 로그인을
        시도할 때 500 에러가 발생하는 경우 제공되는 가이드입니다.
      </p>
      <p>
        만일 해당 가이드를 진행하여도 문제가 지속된다면, 중앙동아리연합회 혹은
        쿠러그(<a href="mailto:we_are@khlug.org">we_are@khlug.org</a>)로 상황 및
        에러 페이지 스크린샷을 함께 전달해주시면 감사하겠습니다.
      </p>
      <img src="/images/stuauth-error-guide/step1.png" alt="Info21 상단의 MY PAGE 위치" />
      <p>
        1. info21 페이지에 로그인한 후, 우측 상단의 <b>MY PAGE</b>를 클릭합니다.
      </p>
      <img src="/images/stuauth-error-guide/step2.png" alt="MY PAGE 메뉴의 개인정보관리 항목" />
      <p>
        2. MY PAGE를 클릭하면 나오는 메뉴 중 <b>개인정보관리</b>를 클릭합니다.
      </p>
      <img src="/images/stuauth-error-guide/step3.png" alt="현재 비밀번호 입력 후 확인 버튼을 누르는 화면" />
      <p>
        3. 비밀번호를 입력하고, <b>확인</b>을 클릭합니다.
      </p>
      <img src="/images/stuauth-error-guide/step4.png" alt="개인정보관리의 휴대폰 및 E-mail 입력란" />
      <p>
        4. 개인정보관리 페이지 내 <b>휴대폰</b>과 <b>E-mail</b> 항목이 정확하게
        입력이 되어 있는지 확인합니다. 대부분의 경우 해당 칸이 비어 있어 에러가
        발생합니다.
      </p>
    </Box>
  );
}
