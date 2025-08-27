import { useState } from 'react'
import { Box, Button, Container, Input, Stack, Text, useDisclosure, DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, CloseButton } from '@chakra-ui/react'
import { getBackendUrl } from './lib/config'
import { z } from 'zod'
import Account from './pages/Account'
import './App.css'

function App() {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const login = useDisclosure()
  const signUp = useDisclosure()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suRepeat, setSuRepeat] = useState('')

  async function handleLogin() {
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      const backend = getBackendUrl()
      const res = await fetch(`${backend}/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Sign in failed')
      }
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
      schema.parse({ email: suEmail, password: suPassword, repeatPassword: suRepeat })
      const backend = getBackendUrl()
      const res = await fetch(`${backend}/auth/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: suEmail, password: suPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Sign up failed')
      }
      setMessage('Please check your email for the verification link to log in.')
      signUp.onClose()
    } catch (e: any) {
      setError(e?.message || 'Sign up failed')
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
        position="relative"
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
      >
        <Box
          position="absolute"
          left="50%"
          transform="translateX(-50%)"
          bottom="25%"
          display="flex"
          gap={4}
        >
          <Button colorScheme="teal" onClick={login.onOpen}>Sign in</Button>
          <Button variant="outline" onClick={signUp.onOpen}>Sign up</Button>
        </Box>
      </Box>

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
          {isAccount ? <Account /> : null}
          {message && <Box color="green.600">{message}</Box>}
          {error && <Box color="red.600">{error}</Box>}
        </Stack>
      </Container>

      {/* Sign in dialog */}
      <DialogRoot open={login.open}>
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
            <CloseButton position="absolute" top="2" right="2" onClick={login.onClose} />
          </DialogHeader>
          <DialogBody>
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
          </DialogBody>
          <DialogFooter>
            <Button mr={3} onClick={login.onClose} variant="ghost">Cancel</Button>
            <Button colorScheme="teal" onClick={handleLogin} loading={submitting}>Sign in</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Sign up dialog */}
      <DialogRoot open={signUp.open}>
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create your account</DialogTitle>
            <CloseButton position="absolute" top="2" right="2" onClick={signUp.onClose} />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Box>
                <Text mb={2} fontWeight="medium">Email</Text>
                <Input type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@example.com" />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium">Password</Text>
                <Input type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium">Repeat password</Text>
                <Input type="password" value={suRepeat} onChange={(e) => setSuRepeat(e.target.value)} />
              </Box>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button mr={3} onClick={signUp.onClose} variant="ghost">Cancel</Button>
            <Button colorScheme="teal" onClick={handleSignUp} loading={submitting}>Sign up</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  )
}

export default App
