import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";

import MainLayout from "../../layouts/MainLayout";
import TipCallout from "../../features/main/TipCallout";
import BookmarkedGroups from "../../features/main/BookmarkedGroups";
import UpcomingSchedules from "../../features/main/UpcomingSchedules";
import RecentDamsoPosts from "../../features/main/RecentDamsoPosts";
import CenterRingLoadingIndicator from "../../components/RingLoadingIndicator/center";
import { useCurrentUser } from "../../hooks/user/useCurrentUser";

export default function MainPage() {
  const navigate = useNavigate();
  const { status, error } = useCurrentUser();

  useEffect(() => {
    if (status === "error" && isAxiosError(error) && error.response?.status === 401) {
      navigate("/login?redirect=/");
    }
  }, [status, error, navigate]);

  if (status === "pending" || status === "error") {
    return (
      <MainLayout>
        <CenterRingLoadingIndicator />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <>
        <TipCallout />
        <BookmarkedGroups />
        <UpcomingSchedules />
        <RecentDamsoPosts />
      </>
    </MainLayout>
  );
}
