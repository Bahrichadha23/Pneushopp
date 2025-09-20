// Page d'inscription
import RegisterForm from "@/components/auth/register-form"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function RegisterPage() {
  return (
    <>
      <Header />
    <div className="bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
    <Footer />
    </>
  )
}
