import { useMemo, useState } from 'react'
import { Box, Button, Container, FormControl, FormHelperText, FormLabel, Heading, Input, ListItem, Stack, Text, UnorderedList } from '@chakra-ui/react'
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
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormHelperText>
            <UnorderedList mt={2} styleType="none">
              <ListItem color={checks.length ? 'green.500' : 'red.500'}>8+ characters</ListItem>
              <ListItem color={checks.upper ? 'green.500' : 'red.500'}>uppercase letter</ListItem>
              <ListItem color={checks.lower ? 'green.500' : 'red.500'}>lowercase letter</ListItem>
              <ListItem color={checks.number ? 'green.500' : 'red.500'}>number</ListItem>
              <ListItem color={checks.special ? 'green.500' : 'red.500'}>special character</ListItem>
            </UnorderedList>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Repeat password</FormLabel>
          <Input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
          <FormHelperText color={checks.match ? 'green.500' : 'red.500'}>
            {checks.match ? 'Passwords match' : 'Passwords must match'}
          </FormHelperText>
        </FormControl>
        {error && (
          <Box color="red.600">{error}</Box>
        )}
        {message && (
          <Box color="green.600">{message}</Box>
        )}
        <Button colorScheme="teal" onClick={handleSignUp} isDisabled={!allValid || submitting} isLoading={submitting}>
          Sign up
        </Button>
          </>
        )}
      </Stack>
    </Container>
  )
}

export default App
