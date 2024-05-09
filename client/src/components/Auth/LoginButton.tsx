import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react';

function LoginButton() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button onPress={onOpen}>Login</Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Login</ModalHeader>
          <ModalBody>
            <div>
              <Input type='email' label='Email' />
              <Input type='password' label='Password' />
            </div>
            or
            <div>
              <Button variant='solid'>Sign in with Google</Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default LoginButton;
