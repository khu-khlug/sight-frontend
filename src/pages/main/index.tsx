import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";

import MainLayout from "../../layouts/MainLayout";
import LegacySiteBanner from "../../features/main/LegacySiteBanner";
import TipCallout from "../../features/main/TipCallout";
import RecentGroups from "../../features/main/RecentGroups";
import UpcomingSchedules from "../../features/main/UpcomingSchedules";
import DamsoAndIdea from "../../features/main/DamsoAndIdea";
import CenterRingLoadingIndicator from "../../components/RingLoadingIndicator/center";
import { useCurrentUser } from "../../hooks/user/useCurrentUser";
import { useCheckFirstTodayLogin } from "../../hooks/user/useCheckFirstEnter";

export default function MainPage() {
  const navigate = useNavigate();
  const { status, error } = useCurrentUser();
  const checkFirstTodayLogin = useCheckFirstTodayLogin();

  useEffect(() => {
    if (
      status === "error" &&
      isAxiosError(error) &&
      error.response?.status === 401
    ) {
      navigate("/login?redirect=/");
    }
  }, [status, error, navigate]);

  useEffect(() => {
    checkFirstTodayLogin.mutate();
  }, [checkFirstTodayLogin.mutate]);

  if (status === "pending" || status === "error") {
    return (
      <MainLayout>
        <CenterRingLoadingIndicator />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <LegacySiteBanner />
      <TipCallout />
      <RecentGroups />
      <UpcomingSchedules />
      <DamsoAndIdea />
    </MainLayout>
  );
}
