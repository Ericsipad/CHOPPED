import { useMemo, useRef, useState } from 'react'
import { Box, Button, Container, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { getSupabase } from './lib/supabaseClient'
import { getFrontendUrl } from './lib/config'
import { z } from 'zod'
import Account from './pages/Account'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)

  const checks = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      match: password.length > 0 && password === repeatPassword,
      email: /.+@.+\..+/.test(email),
    }
  }, [password, repeatPassword, email])

  const allValid = checks.length && checks.upper && checks.lower && checks.number && checks.special && checks.match && checks.email

  async function handleSignUp() {
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      const schema = z
        .object({
          email: z.string().email(),
          password: z
            .string()
            .min(8)
            .regex(/[A-Z]/, 'Needs uppercase')
            .regex(/[a-z]/, 'Needs lowercase')
            .regex(/\d/, 'Needs number')
            .regex(/[^A-Za-z0-9]/, 'Needs special'),
          repeatPassword: z.string(),
        })
        .refine((v: { password: string; repeatPassword: string }) => v.password === v.repeatPassword, {
          path: ['repeatPassword'],
          message: 'Passwords must match',
        })
      schema.parse({ email, password, repeatPassword })
      const frontendBase = getFrontendUrl()
      const supabase = getSupabase()
      const {
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${frontendBase}/account` },
      })
      if (signUpError) throw signUpError
      setMessage('Please check your email for the verification link to log in.')
    } catch (e: any) {
      setError(e?.message || 'Sign up failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isAccount = typeof window !== 'undefined' && window.location.pathname.startsWith('/account')
  return (
    <Container maxW="container.sm" py={16}>
      <Stack gap={6}>
        {isAccount ? (
          <Account />
        ) : (
          <>
        <Box textAlign="center">
          <Button colorScheme="teal" onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            Sign up
          </Button>
        </Box>
        <Box
          ref={formRef as any}
          maxW="md"
          mx="auto"
          w="full"
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderWidth="1px"
          borderRadius="lg"
          boxShadow="sm"
          p={6}
        >
          <Stack gap={4}>
            <Box>
              <Heading size="md">Create your account</Heading>
              <Text mt={2} color="gray.600" _dark={{ color: 'gray.300' }}>
                We do not collect any personal information. We do need an email for communicating with you, so please consider making a dedicated email that is not used anywhere else.
              </Text>
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Email</Text>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Password</Text>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Box mt={2} fontSize="sm">
                <Text color={checks.length ? 'green.500' : 'red.500'}>8+ characters</Text>
                <Text color={checks.upper ? 'green.500' : 'red.500'}>uppercase letter</Text>
                <Text color={checks.lower ? 'green.500' : 'red.500'}>lowercase letter</Text>
                <Text color={checks.number ? 'green.500' : 'red.500'}>number</Text>
                <Text color={checks.special ? 'green.500' : 'red.500'}>special character</Text>
              </Box>
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Repeat password</Text>
              <Input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
              <Text mt={2} fontSize="sm" color={checks.match ? 'green.500' : 'red.500'}>
                {checks.match ? 'Passwords match' : 'Passwords must match'}
              </Text>
            </Box>

            {error && (
              <Box color="red.600">{error}</Box>
            )}
            {message && (
              <Box color="green.600">{message}</Box>
            )}

            <Button colorScheme="teal" onClick={handleSignUp} disabled={!allValid || submitting} loading={submitting}>
              Sign up
            </Button>
          </Stack>
        </Box>
          </>
        )}
      </Stack>
    </Container>
  )
}

export default App
