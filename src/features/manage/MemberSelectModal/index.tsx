import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Dialog,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Check, Search, X } from "lucide-react";

import BaseModal from "../../../components/BaseModal";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import PageNavigator from "../../../components/PageNavigator";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import { ManageUserApiDto, UserManageApi } from "../../../api/manage/user";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

import styles from "./style.module.css";

const LIMIT = 6;

type User = ManageUserApiDto["UserResponse"];

type Props = {
  isOpen: boolean;
  maxSelectableCount: number;
  onClose: () => void;
  onSubmit: (userIds: number[]) => void;
};

function toSearchName(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildListUserRequestDto(
  name: string | null,
  page: number,
): ManageUserApiDto["ListUserRequestDto"] {
  return {
    name,
    number: null,
    college: null,
    email: null,
    phone: null,
    grade: null,
    studentStatus: null,
    tag: null,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  };
}

export default function MemberSelectModal({
  isOpen,
  maxSelectableCount,
  onClose,
  onSubmit,
}: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setSearchInput("");
    setSearchName(null);
    setPage(1);
    setSelectedUsers([]);
  }, [isOpen]);

  const selectableLimit = Math.max(0, maxSelectableCount);

  const selectedUserIds = useMemo(
    () => new Set(selectedUsers.map((user) => user.id)),
    [selectedUsers],
  );

  const {
    status: queryStatus,
    data,
    error,
    refetch,
  } = useQuery({
    queryKey: ["member-select-list", searchName, page],
    queryFn: () =>
      UserManageApi.listUserForManager(buildListUserRequestDto(searchName, page)),
    enabled: isOpen,
    retry: 0,
  });

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const nextSearchName = toSearchName(searchInput);
    setSearchName(nextSearchName);
    setPage(1);

    if (page === 1 && searchName === nextSearchName) {
      refetch();
    }
  };

  const handleToggleUser = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((selectedUser) => selectedUser.id === user.id);

      if (isSelected) {
        return prev.filter((selectedUser) => selectedUser.id !== user.id);
      }

      if (prev.length >= selectableLimit) {
        return prev;
      }

      return [...prev, user];
    });
  };

  const handleSubmit = () => {
    onSubmit(selectedUsers.map((user) => user.id));
  };

  const canSelectMore = selectedUsers.length < selectableLimit;
  const isSubmitDisabled = selectedUsers.length === 0;

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onClose} contentMaxW="720px">
      <Dialog.Header p={0} mb="20px">
        <Dialog.Title fontSize="lg" fontWeight="semibold">
          회원 선택
        </Dialog.Title>
      </Dialog.Header>

      <Dialog.Body p={0}>
        <VStack align="stretch" gap="18px">
          <Box>
            <HStack justify="space-between" align="center" mb="8px">
              <Text fontWeight="medium">선택된 회원</Text>
              <Text color="gray.500" fontSize="sm">
                {selectedUsers.length}/{selectableLimit}
              </Text>
            </HStack>

            <Box className={styles["chip-list"]}>
              {selectedUsers.length === 0 && (
                <Text color="gray.500" fontSize="sm">
                  선택된 회원이 없습니다.
                </Text>
              )}
              {selectedUsers.map((user) => (
                <span className={styles["chip"]} key={user.id}>
                  {user.profile.name}
                  <button
                    type="button"
                    aria-label={`${user.profile.name} 선택 해제`}
                    onClick={() => handleToggleUser(user)}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </Box>
          </Box>

          <form className={styles["search-form"]} onSubmit={handleSearch}>
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="이름으로 검색"
            />
            <Button type="submit" variant="neutral">
              <Search size={16} />
              검색
            </Button>
          </form>

          <Box className={styles["result-panel"]}>
            {(() => {
              switch (queryStatus) {
                case "pending":
                  return <CenterRingLoadingIndicator />;
                case "error":
                  return (
                    <Callout type="error">
                      {extractErrorMessage(error)}
                    </Callout>
                  );
                case "success":
                  return (
                    <>
                      <HStack justify="space-between" mb="10px">
                        <Text fontWeight="medium">검색 결과</Text>
                        <Text color="gray.500" fontSize="sm">
                          {data.count}명
                        </Text>
                      </HStack>

                      {data.users.length === 0 ? (
                        <Callout type="info">검색 결과가 없습니다.</Callout>
                      ) : (
                        <div className={styles["table-wrap"]}>
                          <table className={styles["table"]}>
                            <thead>
                              <tr>
                                <th>이름</th>
                                <th>학번</th>
                                <th>학과</th>
                                <th>선택</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.users.map((user) => {
                                const isSelected = selectedUserIds.has(user.id);
                                const isDisabled = !isSelected && !canSelectMore;

                                return (
                                  <tr key={user.id}>
                                    <td>{user.profile.name}</td>
                                    <td>{user.profile.number ?? "-"}</td>
                                    <td>{user.profile.college}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className={[
                                          styles["select-button"],
                                          isSelected ? styles["selected"] : "",
                                        ]
                                          .filter(Boolean)
                                          .join(" ")}
                                        disabled={isDisabled}
                                        onClick={() => handleToggleUser(user)}
                                      >
                                        {isSelected && <Check size={14} />}
                                        {isSelected ? "선택됨" : "선택"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <Box mt="18px">
                        <PageNavigator
                          currentPage={page}
                          countPerPage={LIMIT}
                          totalCount={data.count}
                          onPageChange={setPage}
                        />
                      </Box>
                    </>
                  );
              }
            })()}
          </Box>
        </VStack>
      </Dialog.Body>

      <Dialog.Footer p={0} mt="22px">
        <HStack justify="flex-end" gap="10px">
          <Button variant="neutral" type="button" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            선택 완료
          </Button>
        </HStack>
      </Dialog.Footer>
    </BaseModal>
  );
}
