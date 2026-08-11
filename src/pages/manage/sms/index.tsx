import { Box } from "@chakra-ui/react";
import SmsManagementContainer from "../../../features/manage/SmsManagementContainer";
import MainLayout from "../../../layouts/MainLayout";

export default function SmsManagePage() {
  return (
    <MainLayout>
      <Box mt="4">
        <SmsManagementContainer />
      </Box>
    </MainLayout>
  );
}
