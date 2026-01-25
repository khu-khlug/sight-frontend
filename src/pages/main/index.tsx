import MainLayout from "../../layouts/MainLayout";
import TipCallout from "../../features/main/TipCallout";
import BookmarkedGroups from "../../features/main/BookmarkedGroups";
import UpcomingSchedules from "../../features/main/UpcomingSchedules";
import RecentDamsoPosts from "../../features/main/RecentDamsoPosts";

export default function MainPage() {
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
