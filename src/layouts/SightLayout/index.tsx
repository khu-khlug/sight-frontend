import Header from "../Header";
import Footer from "../Footer";

type Props = {
  children: React.ReactNode;
};

/**
 * @deprecated `MainLayout`을 활용해주세요.
 */
export default function SightLayout({ children }: Props) {
  return (
    <div className="sight-layout">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
