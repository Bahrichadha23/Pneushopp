import AdminLoginForm from "@/components/auth/admin-login-form"
import Footer from "@/components/footer"

export default function AdminLoginPage() {
  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <AdminLoginForm />
      </div>
      <Footer />
    </>
  )
}
