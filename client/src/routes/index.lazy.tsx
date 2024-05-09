import { createLazyFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { getUser } from '../api/queries';

export const Route = createLazyFileRoute('/')({
  component: MainPage,
});

function MainPage() {
  useEffect(() => {
    const getLoggedUser = async () => await getUser();

    const user = getLoggedUser();
    console.log(user);
  }, []);

  return <div>MainPage</div>;
}
