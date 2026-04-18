import type { NextPage } from 'next'
import Head from 'next/head'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: any) {
  return (
    <>
      <Head>
        <title>Hitech Steel Chat Widget</title>
        <meta name="description" content="AI-powered customer support chatbot" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp