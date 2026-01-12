import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export default async function DebugGalleryPage({
  params,
}: {
  params: { secretUrl: string }
}) {
  const supabase = await createClient()
  const headersList = await headers()

  // Get all headers for debugging
  const allHeaders: Record<string, string> = {}
  headersList.forEach((value, key) => {
    allHeaders[key] = value
  })

  // Try to fetch the dossier
  let dossierResult
  let dossierError
  try {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('secret_url', params.secretUrl)
      .single()

    dossierResult = data
    dossierError = error
  } catch (e) {
    dossierError = e
  }

  // Get environment info
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    HAS_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '18px', marginBottom: '20px', color: '#333' }}>
        🔍 Gallery Debug Info
      </h1>

      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
          Secret URL
        </h2>
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          backgroundColor: '#f9f9f9',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {params.secretUrl}
        </pre>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
          Dossier Query Result
        </h2>
        {dossierError ? (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            <strong>❌ Error:</strong>
            <pre style={{
              whiteSpace: 'pre-wrap',
              backgroundColor: '#fee',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '5px'
            }}>
              {JSON.stringify(dossierError, null, 2)}
            </pre>
          </div>
        ) : dossierResult ? (
          <div style={{ color: 'green', marginBottom: '10px' }}>
            <strong>✅ Success:</strong>
            <pre style={{
              whiteSpace: 'pre-wrap',
              backgroundColor: '#efe',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '5px'
            }}>
              {JSON.stringify(dossierResult, null, 2)}
            </pre>
          </div>
        ) : (
          <div style={{ color: 'orange' }}>
            <strong>⚠️ No result</strong>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
          Environment
        </h2>
        <pre style={{
          whiteSpace: 'pre-wrap',
          backgroundColor: '#f9f9f9',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {JSON.stringify(envInfo, null, 2)}
        </pre>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
          Request Headers
        </h2>
        <pre style={{
          whiteSpace: 'pre-wrap',
          backgroundColor: '#f9f9f9',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          {JSON.stringify(allHeaders, null, 2)}
        </pre>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
          Browser Info (Client Side)
        </h2>
        <div id="browser-info" style={{
          backgroundColor: '#f9f9f9',
          padding: '10px',
          borderRadius: '4px'
        }}>
          Loading...
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('browser-info').innerHTML = [
              'User Agent: ' + navigator.userAgent,
              'Platform: ' + navigator.platform,
              'Cookie Enabled: ' + navigator.cookieEnabled,
              'Language: ' + navigator.language,
              'Online: ' + navigator.onLine,
              'Screen: ' + screen.width + 'x' + screen.height,
              'Cookies: ' + document.cookie || '(none)'
            ].join('<br>');
          `,
        }}
      />

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <strong>📱 How to use:</strong>
        <ol style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Take a screenshot of this entire page</li>
          <li>Check if "Dossier Query Result" shows an error</li>
          <li>Check if cookies are enabled in "Browser Info"</li>
          <li>Compare desktop vs mobile results</li>
        </ol>
      </div>
    </div>
  )
}
