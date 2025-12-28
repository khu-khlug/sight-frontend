import { VStack } from "@chakra-ui/react";

import Location from "../../components/Location";
import AddTransactionFormContainer from "../../features/manage/AddTransactionFormContainer";
import FinanceListContainer from "../../features/member/FinanceListContainer";
import SightLayout from "../../layouts/SightLayout";
import { useIsManager } from "../../hooks/user/useIsManager";

export default function FinancePage() {
  const { isManager } = useIsManager();

  return (
    <SightLayout>
      <Location label="동아리비 장부" />
      <VStack
        as="main"
        gap={0}
        align="stretch"
        maxW="1024px"
        mx="auto"
        w="full"
        px={{ base: 2, md: 4 }}
      >
        {isManager && <AddTransactionFormContainer />}
        <FinanceListContainer />
      </VStack>
    </SightLayout>
  );
}
