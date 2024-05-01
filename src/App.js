import ResponsiveAppBar from './shared-components/appbar';
import DemoHome from './home/demo';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

function App() {
  return (
    <>
      <ResponsiveAppBar />
      <Container maxWidth="lg">
        <DemoHome />
      </Container>

    </>

  );
}

export default App;
