'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userId = searchParams.get('user_id');
    const code = searchParams.get('code');

    if (!userId || !code) {
      setStatus('error');
      setMessage('Lien de vérification invalide. Paramètres manquants.');
      return;
    }

    // Call backend to verify email
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            code: code,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email vérifié avec succès ! Bienvenue chez PneuShop.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Code de vérification invalide ou expiré.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Erreur de connexion au serveur. Veuillez réessayer.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg mb-4">
            <span className="text-3xl font-bold text-black">PS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PneuShop</h1>
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-yellow-500 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vérification en cours
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant la vérification de votre email.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Email vérifié avec succès
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                Redirection vers la page de connexion dans 3 secondes
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-8 py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md"
            >
              Se connecter maintenant
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur de vérification
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/auth/register"
                className="block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-8 py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md"
              >
                Créer un nouveau compte
              </Link>
              <Link
                href="/auth/login"
                className="block bg-gray-100 text-gray-700 font-semibold px-8 py-3 rounded-lg hover:bg-gray-200 transition-all"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Besoin d&apos;aide ?{' '}
            <Link href="/contact" className="text-yellow-600 hover:text-yellow-700 font-medium">
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-yellow-500"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
