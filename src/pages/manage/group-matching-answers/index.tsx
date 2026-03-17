import { Box } from "@chakra-ui/react";
import GroupMatchingAnswerListContainer from "../../../features/manage/GroupMatchingAnswerListContainer";
import MainLayout from "../../../layouts/MainLayout";

export default function GroupMatchingAnswersPage() {
  return (
    <MainLayout>
      <Box mt={4}>
        <GroupMatchingAnswerListContainer />
      </Box>
    </MainLayout>
  );
}
