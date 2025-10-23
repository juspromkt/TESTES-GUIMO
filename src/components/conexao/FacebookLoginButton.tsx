import React, { useCallback, useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit?: () => void;
  }
}

const APP_ID = '2172863509826161';
const FB_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';

type Props = {
  className?: string;
};

const FacebookLoginButton: React.FC<Props> = ({ className }) => {
  const [sdkReady, setSdkReady] = useState(false);
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  const ensureSdk = useCallback(() => {
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      if (!window.FB) return;
      window.FB.init({
        appId: APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v24.0',
      });
      setSdkReady(true);
    };

    const existing = document.querySelector(`script[src="${FB_SDK_SRC}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = FB_SDK_SRC;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    ensureSdk();
  }, [ensureSdk]);

  useEffect(() => {
    const sentRef = { current: false } as { current: boolean };

    const postEmbeddedSignupData = async (payload: any) => {
      try {
        const user = localStorage.getItem('user');
        const token = user ? JSON.parse(user).token : null;
        const res = await fetch(
          'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/oficial',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { token } : {}),
            },
            body: JSON.stringify(payload),
          },
        );
        await res.text();
      } catch {}
    };

    const onMessage = (event: MessageEvent) => {
      // Removed console logging to keep UI clean
      // Only accept messages from Facebook
      if (event.origin !== 'https://www.facebook.com') return;

      let payload: any = null;
      try {
        payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (!payload || payload.type !== 'WA_EMBEDDED_SIGNUP') return;

      if (payload.event === 'FINISH' && !sentRef.current) {
        sentRef.current = true; // avoid duplicate posts
        void postEmbeddedSignupData(payload);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const fbLoginCallback = useCallback((response: any) => {
    if (response && response.authResponse) {
      // Code returned here should be exchanged server-side if needed
      // Keeping callback to satisfy FB.login signature
    }
  }, []);

  const launchWhatsAppSignup = useCallback(() => {
    if (!window.FB) return;
    try {
      window.FB.login(fbLoginCallback, {
        config_id: '2052996935518976',
        response_type: 'code',
        override_default_response_type: true,
        extras: { version: 'v3', featureType: 'whatsapp_business_app_onboarding' },
      });
    } catch {}
  }, [fbLoginCallback]);

  const buttonClass = useMemo(
    () =>
      `inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
        sdkReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
      } bg-[#1877f2] hover:bg-[#166fe5] ${className ?? ''}`,
    [sdkReady, className],
  );

  return (
    <button onClick={launchWhatsAppSignup} disabled={!sdkReady || !isHttps} className={buttonClass} title={!isHttps ? 'Disponível apenas em HTTPS' : undefined}>
      Conectar API oficial
    </button>
  );
};

export default FacebookLoginButton;
