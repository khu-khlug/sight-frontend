import { Box } from "@chakra-ui/react";

import MainLayout from "../../../layouts/MainLayout";
import GroupMatchingCreateContainer from "../../../features/manage/GroupMatchingCreateContainer";

export default function GroupMatchingNewPage() {
  return (
    <MainLayout>
      <Box mt={4}>
        <GroupMatchingCreateContainer />
      </Box>
    </MainLayout>
  );
}
