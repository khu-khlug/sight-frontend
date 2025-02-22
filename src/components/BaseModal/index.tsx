import ReactModal from "react-modal";
import { PropsOf } from "../../util/types";

type Props = Omit<PropsOf<typeof ReactModal>, "style" | "className">;

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: "28px",
    width: "400px",
    border: "0px solid var(--main-color)",
    borderTop: "4px solid var(--main-color)",
    boxShadow: "0px 0px 8px #00000018",
    borderRadius: "8px",
  },
};

export default function BaseModal({ children, ...rest }: Props) {
  return (
    <ReactModal style={customStyles} {...rest}>
      {children}
    </ReactModal>
  );
}
