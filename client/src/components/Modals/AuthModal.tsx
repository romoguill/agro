import {
  Modal,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react';

interface AuthModalPorps {
  onOpen: () => void;
}

function AuthModal({ onOpen }: AuthModalPorps) {
  const { isOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Login</ModalHeader>
        </ModalContent>
      </Modal>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Register</ModalHeader>
        </ModalContent>
      </Modal>
    </>
  );
}

export default AuthModal;
