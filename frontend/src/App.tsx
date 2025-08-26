import { useMemo, useState } from 'react'
import { Box, Button, Container, Field, Heading, Input, List, Stack, Text } from '@chakra-ui/react'
import { supabase } from './lib/supabaseClient'
import { getFrontendUrl } from './lib/config'
import Account from './pages/Account'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      const frontendBase = getFrontendUrl()
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
        <Heading size="lg">Create your account</Heading>
        <Text color="gray.600">
          We do not collect any personal information. We do need an email for communicating with you, so please consider making a dedicated email that is not used anywhere else.
        </Text>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field.HelperText>
            <List.Root mt={2} listStyleType="none">
              <List.Item color={checks.length ? 'green.500' : 'red.500'}>8+ characters</List.Item>
              <List.Item color={checks.upper ? 'green.500' : 'red.500'}>uppercase letter</List.Item>
              <List.Item color={checks.lower ? 'green.500' : 'red.500'}>lowercase letter</List.Item>
              <List.Item color={checks.number ? 'green.500' : 'red.500'}>number</List.Item>
              <List.Item color={checks.special ? 'green.500' : 'red.500'}>special character</List.Item>
            </List.Root>
          </Field.HelperText>
        </Field.Root>
        <Field.Root>
          <Field.Label>Repeat password</Field.Label>
          <Input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
          <Field.HelperText>
            <Text color={checks.match ? 'green.500' : 'red.500'}>
              {checks.match ? 'Passwords match' : 'Passwords must match'}
            </Text>
          </Field.HelperText>
        </Field.Root>
        {error && (
          <Box color="red.600">{error}</Box>
        )}
        {message && (
          <Box color="green.600">{message}</Box>
        )}
        <Button colorScheme="teal" onClick={handleSignUp} disabled={!allValid || submitting} loading={submitting}>
          Sign up
        </Button>
          </>
        )}
      </Stack>
    </Container>
  )
}

export default App
