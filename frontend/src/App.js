import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import { FavoritesProvider } from "./contexts/FavoritesContext"

import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import Boutique from "./pages/Boutique"
import Contact from "./pages/Contact"
import APropos from "./pages/APropos"

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <Router>
            <div className="App">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/boutique" element={<Boutique />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/a-propos" element={<APropos />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
