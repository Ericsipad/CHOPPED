import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section>
          <h1>CHOPPED</h1>
          <p>Modern cooking collaboration platform.</p>
        </section>
        <section>
          <Link
            href="/signup"
            style={{
              display: "inline-block",
              padding: 12,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #1e90ff, #ff2db2, #00c853)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign up
          </Link>
        </section>
      </main>
    </div>
  );
}
