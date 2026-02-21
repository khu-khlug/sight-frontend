import { useTalks } from "../../../hooks/talk/useTalks";
import { Box, Text, Spinner } from "@chakra-ui/react";
import Container from "../../../components/Container";
import TalkItem from "./TalkItem";

type Props = {
  noMargin?: boolean;
};

export default function RecentDamsoPosts({ noMargin = false }: Props) {
  const { data, isLoading } = useTalks({ offset: 0, limit: 5 });

  return (
    <Container noMargin={noMargin}>
      <Text fontSize="xl" fontWeight="bold" marginBottom="16px">
        최근 담소
      </Text>

      {isLoading && (
        <Box display="flex" justifyContent="center" padding="40px">
          <Spinner size="lg" color="var(--main-color)" />
        </Box>
      )}

      {!isLoading && data && data.count === 0 && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding="40px"
        >
          <Text color="gray.500">최근 게시글이 없습니다.</Text>
        </Box>
      )}

      {!isLoading && data && data.count > 0 && (
        <Box display="flex" flexDirection="column">
          {data.talks.map((talk) => (
            <TalkItem key={talk.id} talk={talk} />
          ))}
        </Box>
      )}
    </Container>
  );
}
