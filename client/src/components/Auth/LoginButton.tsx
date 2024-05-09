import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react';
import { login } from '../../api/queries';

function LoginButton() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await login({
      email: 'test4@test.com',
      password: 'pass123',
    });
    console.log(response);
  };

  return (
    <>
      <Button onPress={onOpen}>Login</Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Login</ModalHeader>
          <ModalBody>
            <div>
              <form onSubmit={handleSubmit}>
                <Input type='email' label='Email' />
                <Input type='password' label='Password' />
                <Button type='submit'>Login</Button>
              </form>
            </div>
            or
            <div>
              <Button type='button' variant='solid'>
                Sign in with Google
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default LoginButton;
