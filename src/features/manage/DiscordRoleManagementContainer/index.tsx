import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import {
  DiscordRoleApi,
  DiscordRoleType,
} from "../../../api/manage/discordRole";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
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
      [roleType]: {
        ...prev[roleType],
        roleId: value,
      },
    }));
  };

  const handleSubmit = (roleType: DiscordRoleType) => {
    const role = roles[roleType];
    if (role.id && role.roleId.trim()) {
      mutate({ id: role.id, roleId: role.roleId.trim() });
    }
  };

  const validateRoleId = (roleId: string) => roleId.trim().length > 0;

  if (status === "pending") {
    return <CenterRingLoadingIndicator />;
  }

  if (status === "error") {
    toast.error(
      `디스코드 역할 정보를 불러오는 중 오류가 발생했습니다: ${extractErrorMessage(error)}`
    );
    return <CenterRingLoadingIndicator />;
  }

  return (
    <div className={styles["discord-role-management"]}>
      {(Object.keys(ROLE_TYPE_LABELS) as DiscordRoleType[]).map((roleType) => {
        const role = roles[roleType];
        const isValid = validateRoleId(role.roleId);
        const canUpdate = role.id && isValid && !isUpdatePending;

        return (
          <Container key={roleType}>
            <div className={styles["role-section"]}>
              <h3 className={styles["role-title"]}>
                {ROLE_TYPE_LABELS[roleType]} 역할
              </h3>
              <div className={styles["role-form"]}>
                <div className={styles["input-group"]}>
                  <label
                    htmlFor={`roleId-${roleType}`}
                    className={styles["label"]}
                  >
                    디스코드 역할 ID
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
                  />
                </div>
                <Button
                  onClick={() => handleSubmit(roleType)}
                  disabled={!canUpdate}
                  variant="primary"
                >
                  {isUpdatePending ? "업데이트 중..." : "업데이트"}
                </Button>
              </div>
              {role.id === null && (
                <p className={styles["info-text"]}>
                  이 역할에 대한 설정이 없습니다. 역할 ID를 입력하고
                  업데이트하세요.
                </p>
              )}
            </div>
          </Container>
        );
      })}
    </div>
  );
}
