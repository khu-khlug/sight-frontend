import Header from "../Header";
import Footer from "../Footer";

type Props = {
  children: React.ReactNode;
};

export default function SightLayout({ children }: Props) {
  return (
    <div className="sight-layout">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
