import MainLayout from "../../../layouts/MainLayout";
import BookNavBar from "../../../features/book/BookNavBar";
import BookManageContainer from "../../../features/manage/BookManageContainer";
import Callout from "../../../components/Callout";
import { useIsManager } from "../../../hooks/user/useIsManager";

export default function BookManagePage() {
  const { isManager } = useIsManager();

  return (
    <MainLayout>
      <BookNavBar />
      {isManager ? (
        <BookManageContainer />
      ) : (
        <Callout type="error">권한이 부족합니다.</Callout>
      )}
    </MainLayout>
  );
}
