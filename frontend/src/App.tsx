import { useState } from 'react'
import { Box, Button, Container, Heading, Stack, Text } from '@chakra-ui/react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  return (
    <Container maxW="container.md" py={16}>
      <Stack gap={6} align="start">
        <Heading size="lg">CHOPPED + Chakra UI</Heading>
        <Text color="gray.600">Fresh start with Vite, React, and Chakra UI.</Text>
        <Box>
          <Button colorScheme="teal" onClick={() => setCount((c) => c + 1)}>
            Count is {count}
          </Button>
        </Box>
      </Stack>
    </Container>
  )
}

export default App
