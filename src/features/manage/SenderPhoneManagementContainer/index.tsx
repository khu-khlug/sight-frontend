import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Heading, Input } from "@chakra-ui/react";

import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import { SmsManageApi } from "../../../api/manage/sms";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

import styles from "../SmsManagementContainer/style.module.css";

export default function SenderPhoneManagementContainer() {
  const [senderPhone, setSenderPhone] = useState("");
  const [senderError, setSenderError] = useState<string | null>(null);
  const senderQuery = useQuery({
    queryKey: ["sender-phone"],
    queryFn: SmsManageApi.getSenderPhone,
    retry: 0,
  });
  const senderMutation = useMutation({
    mutationFn: SmsManageApi.updateSenderPhone,
    onSuccess: () => {
      setSenderError(null);
      void senderQuery.refetch();
    },
    onError: (error) => setSenderError(extractErrorMessage(error)),
  });

  useEffect(() => {
    if (senderQuery.data) setSenderPhone(senderQuery.data.phone);
  }, [senderQuery.data]);

  return (
    <section className={styles.card}>
      <Heading size="md">공식 발신번호</Heading>
      {senderQuery.isError && <Callout type="error">{extractErrorMessage(senderQuery.error)}</Callout>}
      <form
        className={styles.inlineForm}
        onSubmit={(event) => {
          event.preventDefault();
          senderMutation.mutate(senderPhone);
        }}
      >
        <Input value={senderPhone} onChange={(event) => setSenderPhone(event.target.value)} aria-label="공식 발신번호" />
        <Button type="submit" variant="neutral" disabled={senderMutation.isPending || !senderPhone.trim()}>저장</Button>
      </form>
      {senderError && <Callout type="error">{senderError}</Callout>}
    </section>
  );
}
