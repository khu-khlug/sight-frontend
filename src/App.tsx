import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import Location from "./Location";
import Button from "./components/Button";
import SightLayout from "./layouts/SightLayout";
import {
  getDoorLockPassword,
  updateDoorLockPassword,
} from "./api/doorLockPassword";
import Container from "./components/Container";
import { extractErrorMessage } from "./util/extractErrorMessage";

import "./App.css";

function App() {
  const { isError, data, error } = useQuery({
    queryKey: ["door-lock-password"],
    queryFn: getDoorLockPassword,
    retry: 0,
  });

  const { mutate } = useMutation({
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
    <SightLayout>
      <Location label="infraBlue" />
      <main className="content">
        {isError ? (
          <Container type="error">{extractErrorMessage(error)}</Container>
        ) : (
          // `isPending` 사용하여 로딩 표현 필요
          <Container>
            <h2>도어락 비밀번호 관리</h2>
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
                <Button type="submit">저장</Button>
              </div>
            </form>
          </Container>
        )}
      </main>
    </SightLayout>
  );
}

export default App;
