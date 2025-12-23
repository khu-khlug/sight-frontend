import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import { GroupMatchingManageApi } from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats, formatDate } from "../../../util/date";

import CreateFieldModal from "./CreateFieldModal";

import styles from "./style.module.css";

export default function GroupMatchingFieldManagementContainer() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    status,
    data: fields,
    error,
    refetch,
  } = useQuery({
    queryKey: ["group-matching-fields-admin"],
    queryFn: GroupMatchingManageApi.listFields,
    retry: 0,
  });

  const { mutateAsync: obsoleteField } = useMutation({
    mutationFn: GroupMatchingManageApi.obsoleteField,
    onSuccess: () => {
      refetch();
    },
  });

  const handleObsolete = async (fieldId: string, fieldName: string) => {
    if (!confirm(`"${fieldName}" 분야를 비활성화하시겠습니까?`)) {
      return;
    }

    try {
      await obsoleteField(fieldId);
      alert("분야가 비활성화되었습니다.");
    } catch (error) {
      alert(extractErrorMessage(error as Error));
    }
  };

  return (
    <>
      <Container>
        <div className={styles["header"]}>
          <h2>관심 분야 관리</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            분야 추가
          </Button>
        </div>

        {(() => {
          switch (status) {
            case "pending":
              return <CenterRingLoadingIndicator />;
            case "error":
              return (
                <Callout type="error">{extractErrorMessage(error)}</Callout>
              );
            case "success":
              return (
                <div className={styles["field-list"]}>
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className={styles["field-item"]}
                      data-obsoleted={!!field.obsoletedAt}
                    >
                      <div className={styles["field-info"]}>
                        <span className={styles["field-name"]}>
                          {field.name}
                        </span>
                        <span className={styles["field-meta"]}>
                          생성:{" "}
                          {formatDate(
                            new Date(field.createdAt),
                            DateFormats.DATE_KOR
                          )}
                          {field.obsoletedAt && (
                            <>
                              {" "}
                              · 비활성화:{" "}
                              {formatDate(
                                new Date(field.obsoletedAt),
                                DateFormats.DATE_KOR
                              )}
                            </>
                          )}
                        </span>
                      </div>
                      {!field.obsoletedAt && (
                        <Button
                          variant="neutral"
                          onClick={() => handleObsolete(field.id, field.name)}
                        >
                          비활성화
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              );
          }
        })()}
      </Container>

      {isCreateModalOpen && (
        <CreateFieldModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
