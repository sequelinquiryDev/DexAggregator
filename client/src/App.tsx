import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Page } from './components/page';
import { routes } from './routes';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Page routes={routes} />
    </QueryClientProvider>
  );
}

export default App;
