import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

function App() {
  const router = createRouter({ routeTree });
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
