import { useBookmarkedGroups } from "../../../hooks/main/useBookmarkedGroups";
import { Box, Text, Spinner } from "@chakra-ui/react";
import Container from "../../../components/Container";
import GroupCard from "./GroupCard";

export default function BookmarkedGroups() {
  const { data, isLoading } = useBookmarkedGroups();

  return (
    <Container>
      <Text fontSize="xl" fontWeight="bold" marginBottom="16px">
        즐겨찾기한 그룹
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
          <Text color="gray.500">즐겨찾기한 그룹이 없습니다.</Text>
        </Box>
      )}

      {!isLoading && data && data.count > 0 && (
        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap="16px"
        >
          {data.groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </Box>
      )}
    </Container>
  );
}
