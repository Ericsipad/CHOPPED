import { useMemo, useRef, useState } from 'react'
import { Box, Button, Container, Heading, Input, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text, useDisclosure, Modal } from '@chakra-ui/react'
import { supabase } from './lib/supabase'
import { getBackendUrl } from './lib/config'
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
  const login = useDisclosure()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

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
  async function handleLogin() {
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
      if (signInError) throw new Error(signInError.message)
      setMessage('Signed in successfully.')
      login.onClose()
    } catch (e: any) {
      setError(e?.message || 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

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
      const backend = getBackendUrl()
      const res = await fetch(`${backend}/auth/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Sign up failed')
      }
      setMessage('Please check your email for the verification link to log in.')
    } catch (e: any) {
      setError(e?.message || 'Sign up failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isAccount = typeof window !== 'undefined' && window.location.pathname.startsWith('/account')
  return (
    <>
      {/* Hero background image (full-bleed) */}
      <Box
        as="section"
        w="100%"
        h="100vh"
        style={{
          backgroundImage:
            "url('https://choppedthumbs.b-cdn.net/Gemini_Generated_Image_jw22ljw22ljw22lj.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000',
        }}
        aria-label="Chopped.dating landing background"
      />

      {/* Lower section full-width image */}
      <Box as="section" w="100%">
        <img
          src="https://choppedthumbs.b-cdn.net/Gemini_Generated_Image_defddcdefddcdefd.png"
          alt="Chopped.dating lower section"
          style={{ display: 'block', width: '100%', height: 'auto' }}
          loading="eager"
        />
      </Box>

      <Container maxW="container.sm" py={16}>
        <Stack gap={6}>
          {isAccount ? (
            <Account />
          ) : (
            <>
            <Box textAlign="center">
              <Button colorScheme="teal" onClick={login.onOpen}>
                Sign in
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

      {/* Sign in modal */}
      <Modal open={login.open} onClose={login.onClose} motionPreset="scale">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign in</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack gap={4}>
              <Box>
                <Text mb={2} fontWeight="medium">Email</Text>
                <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium">Password</Text>
                <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </Box>
              {error && <Box color="red.600">{error}</Box>}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={login.onClose} variant="ghost">Cancel</Button>
            <Button colorScheme="teal" onClick={handleLogin} loading={submitting}>Sign in</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default App
