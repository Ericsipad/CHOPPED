import { useEffect, useState } from 'react'
import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { getBackendUrl } from '../lib/config'

export default function Account() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function init() {
      setLoading(true)
      try {
        const backend = getBackendUrl()
        const sessionRes = await fetch(`${backend}/auth/session`, { credentials: 'include' })
        if (!sessionRes.ok) {
          setError('Not logged in')
          return
        }
        const { user } = await sessionRes.json()
        await fetch(`${backend}/auth/link-user`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        setUserEmail(user?.email ?? null)
      } catch (e: any) {
        setError(e?.message || 'Failed to load account')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    init()
    return () => { isMounted = false }
  }, [])

  return (
    <Container maxW="container.md" py={16}>
      <Stack gap={4}>
        <Heading size="lg">Account</Heading>
        {loading && <Text>Loading...</Text>}
        {error && <Box color="red.600">{error}</Box>}
        {!loading && !error && (
          <Box>
            <Text>Welcome, {userEmail}</Text>
            <Text mt={4} color="gray.600">(Placeholder) 5 profile cards will appear here.</Text>
          </Box>
        )}
      </Stack>
    </Container>
  )
}


