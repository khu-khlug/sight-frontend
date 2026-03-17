import MainLayout from "../../../layouts/MainLayout";
import BookNavBar from "../../../features/book/BookNavBar";
import BookManageContainer from "../../../features/book/BookManageContainer";

export default function BookManagePage() {
  return (
    <MainLayout>
      <BookNavBar />
      <BookManageContainer />
    </MainLayout>
  );
}
