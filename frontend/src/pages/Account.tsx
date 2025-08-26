import { useEffect, useState } from 'react'
import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { supabase } from '../lib/supabaseClient'
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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Not logged in')
          return
        }
        const accessToken = session.access_token
        const linkUrl = `${getBackendUrl()}/auth/link-user`
        await fetch(linkUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({}),
        })
        setUserEmail(session.user?.email ?? null)
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


