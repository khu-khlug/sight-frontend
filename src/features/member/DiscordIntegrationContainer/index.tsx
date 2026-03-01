import { useMutation, useQuery } from "@tanstack/react-query";
import { Heading, List, Text } from "@chakra-ui/react";

import { UserPublicApi } from "../../../api/public/user";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import Container from "../../../components/Container";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import { DateFormats, formatDate } from "../../../util/date";

import styles from "./style.module.css";

function Integrated({
  discordUserId,
  createdAt,
  onDisconnect,
}: {
  discordUserId: string;
  createdAt: Date;
  onDisconnect: () => void;
}) {
  const { mutateAsync: disconnectIntegration, isPending: isDisconnectPending } =
    useMutation({
      mutationFn: UserPublicApi.disconnectDiscordIntegration,
    });

  const handleClick = async () => {
    await disconnectIntegration();
    onDisconnect();
  };

  return (
    <>
      <Text>현재 디스코드와 연동되어 있습니다.</Text>
      <div className={styles["discord-integration-info"]}>
        <List.Root listStyleType="disc" ps="4" my="1">
          <List.Item>디스코드 ID : {discordUserId}</List.Item>
          <List.Item>
            연동 일시 : {formatDate(createdAt, DateFormats.DATE_KOR)}
          </List.Item>
        </List.Root>
      </div>
      <Text>연동을 해제하시려면 아래 버튼을 눌러주세요.</Text>
      <div className={styles["button-wrapper"]}>
        <Button onClick={handleClick} disabled={isDisconnectPending}>
          연동 해제
        </Button>
      </div>
    </>
  );
}

function NotIntegrated({ onIntegrate }: { onIntegrate: () => void }) {
  const { mutateAsync: issueOAuth2Url, isPending: isIssuePending } =
    useMutation({
      mutationFn: UserPublicApi.issueAndRedirectToDiscordOAuth2Url,
    });

  const handleClick = async () => {
    await issueOAuth2Url();
    onIntegrate();
  };

  return (
    <>
      <Text>아직 디스코드와 연동하지 않았습니다.</Text>
      <List.Root listStyleType="disc" ps="4" my="1">
        <List.Item>
          사이트에서 디스코드 연동을 진행해주셔야 쿠러그 디스코드에서 활동하실
          수 있습니다.
        </List.Item>
        <List.Item>
          언제든 디스코드 연동을 해제하고, 다시 연동할 수 있습니다.
        </List.Item>
        <List.Item>
          디스코드 연동 시 디스코드 유저 ID만 수집하고, 연동 해제 시 삭제합니다.
        </List.Item>
      </List.Root>
      <Text>아래 버튼을 눌러 사이트 계정을 디스코드와 연동해주세요.</Text>
      <div className={styles["button-wrapper"]}>
        <Button onClick={handleClick} disabled={isIssuePending}>
          연동 시작
        </Button>
      </div>
    </>
  );
}

export default function DiscordIntegrationContainer() {
  const { status, data, error, refetch } = useQuery({
    queryKey: ["discord-integration"],
    queryFn: UserPublicApi.getDiscordIntegration,
    retry: 0,
  });

  const onIntegrationChanged = () => {
    refetch();
  };

  return (
    <Container className={styles["discord-integration-container"]}>
      <Heading as="h2" size="xl" mb="2">
        디스코드 연동
      </Heading>
      {(() => {
        switch (status) {
          case "pending":
            return <CenterRingLoadingIndicator />;
          case "error":
            return <Callout type="error">{extractErrorMessage(error)}</Callout>;
          case "success":
            return data ? (
              <Integrated
                discordUserId={data.discordUserId}
                createdAt={new Date(data.createdAt)}
                onDisconnect={onIntegrationChanged}
              />
            ) : (
              <NotIntegrated onIntegrate={onIntegrationChanged} />
            );
        }
      })()}
    </Container>
  );
}
