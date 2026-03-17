import MainLayout from "../../layouts/MainLayout";
import BookNavBar from "../../features/book/BookNavBar";
import BookListContainer from "../../features/book/BookListContainer";

export default function BookListPage() {
  return (
    <MainLayout>
      <BookNavBar current="list" />
      <BookListContainer />
    </MainLayout>
  );
}
