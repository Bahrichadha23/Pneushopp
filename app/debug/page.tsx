"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_BASE_URL } from "@/lib/api-client"

export default function DebugPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      // Test 1: Basic connection
      const response1 = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'OPTIONS',
      })
      
      // Test 2: Login attempt
      const response2 = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@pneushop.tn',
          password: 'password123'
        })
      })

      const loginData = await response2.text()

      setTestResult({
        apiBaseUrl: API_BASE_URL,
        optionsStatus: response1.status,
        optionsHeaders: Object.fromEntries(response1.headers.entries()),
        loginStatus: response2.status,
        loginHeaders: Object.fromEntries(response2.headers.entries()),
        loginData: loginData,
        timestamp: new Date().toISOString()
      })

    } catch (error: any) {
      setTestResult({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔧 Authentication Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
            <p><strong>Frontend URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
          </div>

          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test API Connection & Login'}
          </Button>

          {testResult && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          <Alert>
            <AlertDescription>
              This debug tool tests the API connection and login functionality. 
              Check the browser console for additional logs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}