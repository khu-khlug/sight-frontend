import { Box } from "@chakra-ui/react";

import GroupMatchingManagementContainer from "../../../features/manage/GroupMatchingManagementContainer";
import GroupMatchingOptionManagementContainer from "../../../features/manage/GroupMatchingOptionManagementContainer";
import MainLayout from "../../../layouts/MainLayout";

export default function GroupMatchingManagementPage() {
  return (
    <MainLayout>
      <Box mt={4}>
        <GroupMatchingManagementContainer />
        <GroupMatchingOptionManagementContainer />
      </Box>
    </MainLayout>
  );
}
