import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import {
  DiscordRoleApi,
  DiscordRoleType,
} from "../../../api/manage/discordRole";
import { Heading } from "@chakra-ui/react";
import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

import styles from "./style.module.css";

type RoleState = {
  id: number | null;
  roleId: string;
};

const ROLE_TYPE_LABELS: Record<DiscordRoleType, string> = {
  MEMBER: "회원",
  GRADUATED_MEMBER: "명예회원",
  MANAGER: "운영진",
};

export default function DiscordRoleManagementContainer() {
  const queryClient = useQueryClient();

  const { status, data, error } = useQuery({
    queryKey: ["discord-roles"],
    queryFn: DiscordRoleApi.getDiscordRoles,
    retry: 0,
  });

  const { mutate, isPending: isUpdatePending } = useMutation({
    mutationFn: ({ id, roleId }: { id: number; roleId: string }) =>
      DiscordRoleApi.updateDiscordRole(id, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discord-roles"] });
      toast.success("역할이 성공적으로 업데이트되었습니다.");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const [roles, setRoles] = useState<Record<DiscordRoleType, RoleState>>({
    MEMBER: { id: null, roleId: "" },
    GRADUATED_MEMBER: { id: null, roleId: "" },
    MANAGER: { id: null, roleId: "" },
  });

  useEffect(() => {
    if (data) {
      const newRoles: Record<DiscordRoleType, RoleState> = {
        MEMBER: { id: null, roleId: "" },
        GRADUATED_MEMBER: { id: null, roleId: "" },
        MANAGER: { id: null, roleId: "" },
      };

      data.forEach((role) => {
        newRoles[role.roleType] = {
          id: role.id,
          roleId: role.roleId,
        };
      });

      setRoles(newRoles);
    }
  }, [data]);

  const handleRoleIdChange = (roleType: DiscordRoleType, value: string) => {
    setRoles((prev) => ({
      ...prev,
      [roleType]: { ...prev[roleType], roleId: value },
    }));
  };

  const validateRoleId = (roleId: string) => roleId.trim().length > 0;

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    roleType: DiscordRoleType
  ) => {
    e.preventDefault();

    const role = roles[roleType];
    if (role.id && role.roleId.trim() && validateRoleId(role.roleId)) {
      mutate({ id: role.id, roleId: role.roleId.trim() });
    }
  };

  const hasNullIdRoles = data
    ? Object.values(roles).some((role) => role.id === null)
    : false;

  if (status === "pending") {
    return <CenterRingLoadingIndicator />;
  }

  if (status === "error") {
    toast.error(extractErrorMessage(error));
    return <CenterRingLoadingIndicator />;
  }

  if (hasNullIdRoles) {
    return (
      <Container>
        <div className={styles["discord-role-management"]}>
          <Heading as="h2" size="xl">디스코드 역할 관리</Heading>
          <Callout type="error">
            디스코드 역할이 아직 설정되지 않았습니다. 개발 운영진에게
            문의해주세요.
          </Callout>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles["discord-role-management"]}>
        <h2>디스코드 역할 관리</h2>
        {(Object.keys(ROLE_TYPE_LABELS) as DiscordRoleType[]).map(
          (roleType) => {
            const role = roles[roleType];

            return (
              <div key={roleType} className={styles["role-section"]}>
                <form onSubmit={(e) => handleSubmit(e, roleType)}>
                  <div className={styles["input-group"]}>
                    <label
                      htmlFor={`roleId-${roleType}`}
                      className={styles["label"]}
                    >
                      {ROLE_TYPE_LABELS[roleType]}
                    </label>
                    <input
                      id={`roleId-${roleType}`}
                      type="text"
                      value={role.roleId}
                      onChange={(e) =>
                        handleRoleIdChange(roleType, e.target.value)
                      }
                      placeholder="디스코드 역할 ID를 입력하세요"
                      className={styles["input"]}
                      disabled={isUpdatePending}
                    />
                  </div>
                </form>
              </div>
            );
          }
        )}
      </div>
    </Container>
  );
}
