import { Dialog, Portal } from "@chakra-ui/react";

type Props = {
  isOpen: boolean;
  onRequestClose?: () => void;
  children?: React.ReactNode;
};

export default function BaseModal({ isOpen, onRequestClose, children }: Props) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open && onRequestClose) {
          onRequestClose();
        }
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            p="28px"
            maxW="400px"
            borderTop="4px solid"
            borderColor="brand.500"
            boxShadow="0px 0px 8px #00000018"
            borderRadius="8px"
          >
            {children}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
