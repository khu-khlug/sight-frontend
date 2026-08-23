import { Box, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import Container from "../../components/Container";
import SupportRequestForm from "../../features/support/SupportRequestForm";
import { useCreateSupportRequest } from "../../hooks/supportRequest/useSupportRequests";
import MainLayout from "../../layouts/MainLayout";
import { extractErrorMessage } from "../../util/extractErrorMessage";

export default function SupportRequestNewPage() {
  const navigate = useNavigate();
  const createSupportRequest = useCreateSupportRequest();

  return (
    <MainLayout>
      <Box mt={{ base: 4, md: 6 }}>
        <Container>
          <Box as="main" pt={0} pb={6}>
            <Heading size="xl" mb={5}>지원 신청 등록</Heading>
            <SupportRequestForm
              submitLabel="등록"
              isSubmitting={createSupportRequest.isPending}
              error={createSupportRequest.isError ? extractErrorMessage(createSupportRequest.error) : null}
              onSubmit={(input) => {
                createSupportRequest.mutate(input, {
                  onSuccess: (supportRequest) => navigate(`/support/${supportRequest.id}`),
                });
              }}
              onCancel={() => navigate("/support")}
            />
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
