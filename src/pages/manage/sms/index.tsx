import { Box } from "@chakra-ui/react";
import SmsManagementContainer from "../../../features/manage/SmsManagementContainer";
import SenderPhoneManagementContainer from "../../../features/manage/SenderPhoneManagementContainer";
import MainLayout from "../../../layouts/MainLayout";

export default function SmsManagePage() {
  return (
    <MainLayout>
      <Box mt="4">
        <SenderPhoneManagementContainer />
        <SmsManagementContainer />
      </Box>
    </MainLayout>
  );
}
