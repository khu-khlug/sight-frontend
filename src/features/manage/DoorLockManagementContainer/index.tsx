import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import {
  getDoorLockPassword,
  updateDoorLockPassword,
} from "../../../api/manage/doorLockPassword";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

import "./style.css";

export default function DoorLockManagementContainer() {
  const { status, data, error } = useQuery({
    queryKey: ["door-lock-password"],
    queryFn: getDoorLockPassword,
    retry: 0,
  });

  const { mutate, isPending: isUpdatePending } = useMutation({
    mutationFn: updateDoorLockPassword,
  });

  const [masterPassword, setMasterPassword] = useState("");
  const [jajudyPassword, setJajudyPassword] = useState("");
  const [facilityTeamPassword, setFacilityTeamPassword] = useState("");

  useEffect(() => {
    if (data) {
      setMasterPassword(data.master);
      setJajudyPassword(data.forJajudy);
      setFacilityTeamPassword(data.forFacilityTeam);
    }
  }, [data]);

  const validatePassword = (password: string) => /^\d{6,12}$/.test(password);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isAnyPasswordInvalid = [
      masterPassword,
      jajudyPassword,
      facilityTeamPassword,
    ].every(validatePassword);

    if (!isAnyPasswordInvalid) {
      return;
    }

    mutate({
      master: masterPassword,
      forJajudy: jajudyPassword,
      forFacilityTeam: facilityTeamPassword,
    });
  };

  return (
    <Container className="door-lock-management-container">
      <h2>도어락 비밀번호 관리</h2>
      {(() => {
        switch (status) {
          case "pending":
            return <CenterRingLoadingIndicator />;
          case "error":
            return <Callout type="error">{extractErrorMessage(error)}</Callout>;
          case "success":
            return (
              <form onSubmit={handleSubmit}>
                <div className="text-input-with-label">
                  <label>마스터 비밀번호</label>
                  <input
                    type="text"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                  ></input>
                </div>
                <div className="text-input-with-label">
                  <label>중앙동아리연합회용 비밀번호</label>
                  <input
                    type="text"
                    value={jajudyPassword}
                    onChange={(e) => setJajudyPassword(e.target.value)}
                  ></input>
                </div>
                <div className="text-input-with-label">
                  <label>시설팀용 비밀번호</label>
                  <input
                    type="text"
                    value={facilityTeamPassword}
                    onChange={(e) => setFacilityTeamPassword(e.target.value)}
                  ></input>
                </div>
                <div className="form-button">
                  <small className="description mr-16">
                    비밀번호를 사용하면 운영진에게 알람이 갑니다.
                  </small>
                  <Button type="submit" disabled={isUpdatePending}>
                    저장
                  </Button>
                </div>
              </form>
            );
        }
      })()}
    </Container>
  );
}
