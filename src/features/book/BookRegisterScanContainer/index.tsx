import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Text, Button } from "@chakra-ui/react";
import { toast } from "react-toastify";

import Callout from "../../../components/Callout";
import BarcodeScanner, { ScanResult } from "../../../components/BarcodeScanner";
import BookScanLayout from "../BookScanLayout";
import { BookManageApi } from "../../../api/manage/book";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

type State =
  | { status: "idle" }
  | { status: "registering" }
  | { status: "error"; message: string };

export default function BookRegisterScanContainer() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "idle" });

  const handleScan = async (result: ScanResult) => {
    if (!result.data) {
      setState({ status: "error", message: "바코드를 인식하지 못했습니다." });
      return;
    }

    setState({ status: "registering" });
    try {
      const { bookId } = await BookManageApi.registerBook(result.data);
      toast.success("도서가 등록되었습니다.");
      navigate(`/book/${bookId}`);
    } catch (e) {
      setState({ status: "error", message: extractErrorMessage(e as Error) });
    }
  };

  const handleRescan = () => setState({ status: "idle" });

  const scanSection = (() => {
    if (state.status === "registering") {
      return (
        <Box
          w="full"
          aspectRatio="4/3"
          bg="gray.100"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="gray.500">등록 중...</Text>
        </Box>
      );
    }

    if (state.status === "error") {
      return (
        <>
          <Callout type="error">{state.message}</Callout>
          <Button mt={3} w="full" variant="outline" onClick={handleRescan}>
            다시 스캔
          </Button>
        </>
      );
    }

    return <BarcodeScanner onScan={handleScan} />;
  })();

  return (
    <BookScanLayout title="도서 등록" scanSection={scanSection} book={null} />
  );
}
