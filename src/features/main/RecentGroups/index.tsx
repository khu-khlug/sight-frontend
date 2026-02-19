import { useRecentGroups } from "../../../hooks/main/useRecentGroups";
import { Box, Text, Spinner, Link } from "@chakra-ui/react";
import Container from "../../../components/Container";
import GroupCard from "../components/GroupCard";

export default function RecentGroups() {
  const { data, isLoading, isError, refetch } = useRecentGroups();

  return (
    <Container>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="16px"
      >
        <Text fontSize="xl" fontWeight="bold">
          최근 활동한 그룹
        </Text>
        <Link
          href="https://khlug.org/group"
          color="var(--main-color)"
          fontSize="sm"
          fontWeight="medium"
          _hover={{ textDecoration: "underline" }}
        >
          모든 그룹 보기
        </Link>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" padding="40px">
          <Spinner size="lg" color="var(--main-color)" />
        </Box>
      )}

      {!isLoading && isError && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding="40px"
          gap="8px"
        >
          <Text color="gray.500">그룹을 불러오지 못했습니다.</Text>
          <Link
            color="var(--main-color)"
            cursor="pointer"
            onClick={() => refetch()}
            _hover={{ textDecoration: "underline" }}
          >
            다시 시도
          </Link>
        </Box>
      )}

      {!isLoading && !isError && data?.count === 0 && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding="40px"
        >
          <Text color="gray.500">가입한 그룹이 없습니다.</Text>
        </Box>
      )}

      {!isLoading && !isError && data && data.count > 0 && (
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
