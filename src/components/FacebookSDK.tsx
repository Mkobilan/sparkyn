'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface FacebookSDKProps {
  appId: string
}

declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: any
  }
}

export default function FacebookSDK({ appId }: FacebookSDKProps) {
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : appId,
        cookie     : true,
        xfbml      : true,
        version    : 'v21.0'
      });
    };
  }, [appId])

  return (
    <Script
      id="facebook-jssdk"
      src="https://connect.facebook.net/en_US/sdk.js"
      strategy="afterInteractive"
    />
  )
}
