export default function TermsPage() {
  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>Terms and Conditions</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>Placeholder terms. Replace with your real legal text.</p>
      <ul>
        <li>Be respectful. No illegal content.</li>
        <li>You must be 18 years or older to use this service.</li>
        <li>Your images are private to logged-in users via our app; do not share access.</li>
      </ul>
    </main>
  );
}


