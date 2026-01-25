import NavigationBar from "../NavigationBar";
import "./style.css";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <div className="main-layout">
      <NavigationBar />
      <div className="main-layout__content">{children}</div>
    </div>
  );
}
