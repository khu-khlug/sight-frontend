import { Box } from "@chakra-ui/react";
import MemberListContainer from "../../../features/manage/MemberListContainer";
import MainLayout from "../../../layouts/MainLayout";

export default function ManageMemberPage() {
  return (
    <MainLayout>
      <Box mt="4">
        <MemberListContainer />
      </Box>
    </MainLayout>
  );
}
