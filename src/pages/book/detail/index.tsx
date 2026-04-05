import { useParams } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BookNavBar from "../../../features/book/BookNavBar";
import BookDetailContainer from "../../../features/member/BookDetailContainer";

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  return (
    <MainLayout>
      <BookNavBar />
      <BookDetailContainer bookId={bookId!} />
    </MainLayout>
  );
}
