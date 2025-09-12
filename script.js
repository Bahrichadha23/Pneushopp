// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Declare emailjs variable
let emailjs

class AuthModal {
  constructor() {
    this.modal = document.getElementById("authModal")
    this.loginForm = document.getElementById("loginForm")
    this.registerForm = document.getElementById("registerForm")
    this.forgotPasswordForm = document.getElementById("forgotPasswordForm")
    this.emailVerificationForm = document.getElementById("emailVerificationForm")
    this.closeBtn = document.querySelector(".auth-close")
    this.showRegisterLink = document.getElementById("showRegister")
    this.showLoginLink = document.getElementById("showLogin")
    this.showForgotPasswordLink = document.getElementById("showForgotPassword")
    this.backToLoginLink = document.getElementById("backToLogin")
    this.resendCodeLink = document.getElementById("resendCode")
    this.userIcon = document.querySelector('.icon-btn[aria-label="Mon compte"]')

    // EmailJS configuration - replace with your actual service details
    this.emailJSConfig = {
      serviceID: "your_service_id",
      templateID: "your_template_id",
      userID: "your_user_id",
    }

    // Store verification code and user data temporarily
    this.verificationCode = null
    this.pendingUserData = null

    this.init()
  }

  init() {
    if (!this.modal) return

    // Initialize EmailJS
    this.initEmailJS()

    // Open modal when user icon is clicked
    if (this.userIcon) {
      this.userIcon.addEventListener("click", () => this.openModal())
    }

    // Close modal events
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.closeModal())
    }

    // Close modal when clicking outside
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal()
      }
    })

    // Switch between forms
    if (this.showRegisterLink) {
      this.showRegisterLink.addEventListener("click", (e) => {
        e.preventDefault()
        this.showRegister()
      })
    }

    if (this.showLoginLink) {
      this.showLoginLink.addEventListener("click", (e) => {
        e.preventDefault()
        this.showLogin()
      })
    }

    if (this.showForgotPasswordLink) {
      this.showForgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault()
        this.showForgotPassword()
      })
    }

    if (this.backToLoginLink) {
      this.backToLoginLink.addEventListener("click", (e) => {
        e.preventDefault()
        this.showLogin()
      })
    }

    if (this.resendCodeLink) {
      this.resendCodeLink.addEventListener("click", (e) => {
        e.preventDefault()
        this.resendVerificationCode()
      })
    }

    // Handle form submissions
    this.bindFormEvents()

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.style.display === "block") {
        this.closeModal()
      }
    })
  }

  initEmailJS() {
    // Initialize EmailJS with your user ID
    if (typeof emailjs !== "undefined") {
      emailjs.init(this.emailJSConfig.userID)
    } else {
      console.warn("EmailJS not loaded. Email functionality will be simulated.")
    }
  }

  openModal() {
    this.modal.style.display = "block"
    document.body.style.overflow = "hidden"
    this.showLogin() // Default to login form
  }

  closeModal() {
    this.modal.style.display = "none"
    document.body.style.overflow = "auto"
    this.resetForms()
  }

  showLogin() {
    this.hideAllForms()
    this.loginForm.classList.add("active")
  }

  showRegister() {
    this.hideAllForms()
    this.registerForm.classList.add("active")
  }

  showForgotPassword() {
    this.hideAllForms()
    this.forgotPasswordForm.classList.add("active")
  }

  showEmailVerification() {
    this.hideAllForms()
    this.emailVerificationForm.classList.add("active")
  }

  hideAllForms() {
    this.loginForm.classList.remove("active")
    this.registerForm.classList.remove("active")
    this.forgotPasswordForm.classList.remove("active")
    this.emailVerificationForm.classList.remove("active")
  }

  resetForms() {
    document.querySelectorAll(".auth-form form").forEach((form) => form.reset())
    this.verificationCode = null
    this.pendingUserData = null
  }

  bindFormEvents() {
    // Login form submission
    const loginFormElement = this.loginForm.querySelector("form")
    if (loginFormElement) {
      loginFormElement.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleLogin(e.target)
      })
    }

    // Register form submission
    const registerFormElement = this.registerForm.querySelector("form")
    if (registerFormElement) {
      registerFormElement.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleRegister(e.target)
      })
    }

    // Forgot password form submission
    const forgotPasswordFormElement = this.forgotPasswordForm.querySelector("form")
    if (forgotPasswordFormElement) {
      forgotPasswordFormElement.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleForgotPassword(e.target)
      })
    }

    // Email verification form submission
    const verificationFormElement = this.emailVerificationForm.querySelector("form")
    if (verificationFormElement) {
      verificationFormElement.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleEmailVerification(e.target)
      })
    }
  }

  handleLogin(form) {
    const formData = new FormData(form)
    const email = formData.get("email")
    const password = formData.get("password")

    // Basic validation
    if (!email || !password) {
      alert("Veuillez remplir tous les champs")
      return
    }

    // Simulate login process
    console.log("Login attempt:", { email, password })

    // Here you would typically send data to your backend
    // For now, we'll simulate a successful login
    setTimeout(() => {
      alert("Connexion réussie!")
      this.closeModal()
      // You could redirect or update UI here
    }, 1000)
  }

  handleRegister(form) {
    const formData = new FormData(form)
    const name = formData.get("name")
    const email = formData.get("email")
    const password = formData.get("password")
    const confirmPassword = formData.get("confirmPassword")

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      alert("Veuillez remplir tous les champs")
      return
    }

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    // Store user data temporarily
    this.pendingUserData = { name, email, password }

    // Send verification email
    this.sendVerificationEmail(email, name)
  }

  handleForgotPassword(form) {
    const formData = new FormData(form)
    const email = formData.get("email")

    if (!email) {
      alert("Veuillez entrer votre adresse email")
      return
    }

    // Send password reset email
    this.sendPasswordResetEmail(email)
  }

  handleEmailVerification(form) {
    const formData = new FormData(form)
    const enteredCode = formData.get("code")

    if (!enteredCode) {
      alert("Veuillez entrer le code de vérification")
      return
    }

    if (enteredCode === this.verificationCode) {
      // Verification successful
      alert("Email vérifié avec succès! Votre compte a été créé.")
      console.log("Account created:", this.pendingUserData)

      // Here you would typically create the account in your backend
      this.showLogin()
      this.resetForms()
    } else {
      alert("Code de vérification incorrect. Veuillez réessayer.")
    }
  }

  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  sendVerificationEmail(email, name) {
    this.verificationCode = this.generateVerificationCode()

    const templateParams = {
      to_email: email,
      to_name: name,
      verification_code: this.verificationCode,
      site_name: "PNEU SHOP",
    }

    if (typeof emailjs !== "undefined") {
      emailjs
        .send(this.emailJSConfig.serviceID, this.emailJSConfig.templateID, templateParams)
        .then((response) => {
          console.log("Verification email sent successfully:", response)
          alert("Un code de vérification a été envoyé à votre adresse email.")
          this.showEmailVerification()
        })
        .catch((error) => {
          console.error("Failed to send verification email:", error)
          alert("Erreur lors de l'envoi de l'email. Veuillez réessayer.")
        })
    } else {
      // Simulate email sending for development
      console.log("Simulated verification email sent to:", email, "Code:", this.verificationCode)
      alert(`Code de vérification envoyé à ${email}. Code: ${this.verificationCode} (simulation)`)
      this.showEmailVerification()
    }
  }

  sendPasswordResetEmail(email) {
    const resetToken = this.generateVerificationCode()

    const templateParams = {
      to_email: email,
      reset_token: resetToken,
      reset_link: `${window.location.origin}/reset-password?token=${resetToken}`,
      site_name: "PNEU SHOP",
    }

    if (typeof emailjs !== "undefined") {
      emailjs
        .send(this.emailJSConfig.serviceID, "password_reset_template", templateParams)
        .then((response) => {
          console.log("Password reset email sent successfully:", response)
          alert("Un lien de réinitialisation a été envoyé à votre adresse email.")
          this.showLogin()
        })
        .catch((error) => {
          console.error("Failed to send password reset email:", error)
          alert("Erreur lors de l'envoi de l'email. Veuillez réessayer.")
        })
    } else {
      // Simulate email sending for development
      console.log("Simulated password reset email sent to:", email, "Token:", resetToken)
      alert(`Lien de réinitialisation envoyé à ${email}. Token: ${resetToken} (simulation)`)
      this.showLogin()
    }
  }

  resendVerificationCode() {
    if (this.pendingUserData) {
      this.sendVerificationEmail(this.pendingUserData.email, this.pendingUserData.name)
    } else {
      alert("Erreur: Aucune donnée utilisateur en attente.")
    }
  }
}

// Tire configurator functionality
class TireConfigurator {
  constructor() {
    this.selectors = {
      largeur: document.querySelector(".selector-item:nth-child(1) select"),
      hauteur: document.querySelector(".selector-item:nth-child(2) select"),
      radial: document.querySelector(".selector-item:nth-child(3) select"),
      diametre: document.querySelector(".selector-item:nth-child(4) select"),
      charge: document.querySelector(".selector-item:nth-child(5) select"),
      vitesse: document.querySelector(".selector-item:nth-child(6) select"),
    }

    this.searchBtn = document.querySelector(".search-btn")
    this.init()
  }

  init() {
    this.populateSelectors()
    this.bindEvents()
  }

  populateSelectors() {
    // Largeur options
    const largeurOptions = [
      "155",
      "165",
      "175",
      "185",
      "195",
      "205",
      "215",
      "225",
      "235",
      "245",
      "255",
      "265",
      "275",
      "285",
      "295",
    ]
    this.populateSelect(this.selectors.largeur, largeurOptions, "Choisir la largeur")

    // Hauteur options
    const hauteurOptions = ["35", "40", "45", "50", "55", "60", "65", "70", "75", "80"]
    this.populateSelect(this.selectors.hauteur, hauteurOptions, "Choisir la hauteur")

    // Radial options
    const radialOptions = ["R"]
    this.populateSelect(this.selectors.radial, radialOptions, "Choisir le radial")

    // Diamètre options
    const diametreOptions = ["13", "14", "15", "16", "17", "18", "19", "20", "21", "22"]
    this.populateSelect(this.selectors.diametre, diametreOptions, "Choisir le diamètre")

    // Charge options
    const chargeOptions = ["75", "80", "82", "84", "86", "88", "90", "91", "92", "94", "95", "96", "98", "100"]
    this.populateSelect(this.selectors.charge, chargeOptions, "Choisir la charge")

    // Vitesse options
    const vitesseOptions = ["H", "V", "W", "Y", "T", "S", "Q"]
    this.populateSelect(this.selectors.vitesse, vitesseOptions, "Choisir la vitesse")
  }

  populateSelect(selectElement, options, placeholder) {
    if (!selectElement) return

    selectElement.innerHTML = `<option value="">${placeholder}</option>`
    options.forEach((option) => {
      const optionElement = document.createElement("option")
      optionElement.value = option
      optionElement.textContent = option
      selectElement.appendChild(optionElement)
    })
  }

  bindEvents() {
    if (this.searchBtn) {
      this.searchBtn.addEventListener("click", () => this.handleSearch())
    }

    // Add change listeners to selectors
    Object.values(this.selectors).forEach((selector) => {
      if (selector) {
        selector.addEventListener("change", () => this.updateTireDisplay())
      }
    })
  }

  updateTireDisplay() {
    const values = {}
    Object.keys(this.selectors).forEach((key) => {
      if (this.selectors[key]) {
        values[key] = this.selectors[key].value
      }
    })

    // Update tire size display if all required fields are filled
    if (values.largeur && values.hauteur && values.radial && values.diametre) {
      let tireSize = `${values.largeur}/${values.hauteur} ${values.radial} ${values.diametre}`
      if (values.charge) tireSize += ` ${values.charge}`
      if (values.vitesse) tireSize += ` ${values.vitesse}`

      console.log("Tire size:", tireSize)
    }
  }

  handleSearch() {
    const values = {}
    let hasRequiredFields = true

    // Check required fields
    ;["largeur", "hauteur", "radial", "diametre"].forEach((key) => {
      if (this.selectors[key]) {
        values[key] = this.selectors[key].value
        if (!values[key]) {
          hasRequiredFields = false
        }
      }
    })

    if (!hasRequiredFields) {
      alert("Veuillez remplir tous les champs obligatoires (marqués par *)")
      return
    }
    // Get optional fields
    ;["charge", "vitesse"].forEach((key) => {
      if (this.selectors[key]) {
        values[key] = this.selectors[key].value
      }
    })

    // Simulate search
    const tireSize = `${values.largeur}/${values.hauteur} ${values.radial} ${values.diametre}`
    alert(`Recherche de pneus pour la taille: ${tireSize}`)

    console.log("Searching for tires with specifications:", values)
  }
}

// Header scroll effect
class HeaderScroll {
  constructor() {
    this.header = document.querySelector(".header")
    this.init()
  }

  init() {
    window.addEventListener("scroll", () => this.handleScroll())
  }

  handleScroll() {
    if (window.scrollY > 100) {
      this.header.style.background = "rgba(255, 255, 255, 0.95)"
      this.header.style.backdropFilter = "blur(10px)"
    } else {
      this.header.style.background = "white"
      this.header.style.backdropFilter = "none"
    }
  }
}

// Intersection Observer for animations
class ScrollAnimations {
  constructor() {
    this.init()
  }

  init() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1"
          entry.target.style.transform = "translateY(0)"
        }
      })
    }, observerOptions)

    // Observe elements for animation
    const animatedElements = document.querySelectorAll(".news-item, .product-item, .feature-item")
    animatedElements.forEach((el) => {
      el.style.opacity = "0"
      el.style.transform = "translateY(30px)"
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
      observer.observe(el)
    })
  }
}

// Mobile menu functionality
class MobileMenu {
  constructor() {
    this.menuToggle = document.querySelector(".header-icons .icon:last-child")
    this.nav = document.querySelector(".nav")
    this.init()
  }

  init() {
    if (this.menuToggle) {
      this.menuToggle.addEventListener("click", () => this.toggleMenu())
    }

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.nav.contains(e.target) && !this.menuToggle.contains(e.target)) {
        this.closeMenu()
      }
    })
  }

  toggleMenu() {
    this.nav.classList.toggle("mobile-open")
  }

  closeMenu() {
    this.nav.classList.remove("mobile-open")
  }
}

// Cart functionality
class CartManager {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("cart")) || []
    this.cartModal = document.getElementById("cartModal")
    this.cartIcon = document.querySelector('.icon-btn[aria-label="Panier"]')
    this.cartClose = document.querySelector(".cart-close")
    this.emptyCart = document.getElementById("emptyCart")
    this.cartItems = document.getElementById("cartItems")
    this.cartItemsList = document.querySelector(".cart-items-list")
    this.cartTotal = document.getElementById("cartTotal")

    this.init()
  }

  init() {
    if (!this.cartModal) return

    // Open cart when cart icon is clicked
    if (this.cartIcon) {
      this.cartIcon.addEventListener("click", () => this.openCart())
    }

    // Close cart events
    if (this.cartClose) {
      this.cartClose.addEventListener("click", () => this.closeCart())
    }

    // Close cart when clicking outside
    this.cartModal.addEventListener("click", (e) => {
      if (e.target === this.cartModal) {
        this.closeCart()
      }
    })

    // Close cart with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.cartModal.style.display === "block") {
        this.closeCart()
      }
    })

    this.updateCartDisplay()
  }

  openCart() {
    this.cartModal.style.display = "block"
    document.body.style.overflow = "hidden"
    this.updateCartDisplay()
  }

  closeCart() {
    this.cartModal.style.display = "none"
    document.body.style.overflow = "auto"
  }

  addItem(name, price, image = "/placeholder.svg?height=150&width=150") {
    const existingItem = this.cart.find((item) => item.name === name)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      this.cart.push({
        id: Date.now(),
        name: name,
        price: Number.parseFloat(price),
        quantity: 1,
        image: image,
      })
    }

    this.saveCart()
    this.updateCartDisplay()

    // Show success message
    this.showAddToCartMessage(name)
  }

  removeItem(id) {
    this.cart = this.cart.filter((item) => item.id !== id)
    this.saveCart()
    this.updateCartDisplay()
  }

  updateQuantity(id, quantity) {
    const item = this.cart.find((item) => item.id === id)
    if (item) {
      item.quantity = Math.max(1, Number.parseInt(quantity))
      this.saveCart()
      this.updateCartDisplay()
    }
  }

  saveCart() {
    localStorage.setItem("cart", JSON.stringify(this.cart))
  }

  updateCartDisplay() {
    if (this.cart.length === 0) {
      this.emptyCart.style.display = "block"
      this.cartItems.style.display = "none"
    } else {
      this.emptyCart.style.display = "none"
      this.cartItems.style.display = "block"
      this.renderCartItems()
      this.updateTotal()
    }
  }

  renderCartItems() {
    this.cartItemsList.innerHTML = ""

    this.cart.forEach((item) => {
      const cartItemElement = document.createElement("div")
      cartItemElement.className = "cart-item"
      cartItemElement.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${item.price.toFixed(2)} DT</div>
        </div>
        <div class="cart-item-quantity">
          <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                 onchange="cartManager.updateQuantity(${item.id}, this.value)">
          <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
        </div>
        <button class="remove-item-btn" onclick="cartManager.removeItem(${item.id})" title="Supprimer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      `
      this.cartItemsList.appendChild(cartItemElement)
    })
  }

  updateTotal() {
    const total = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    this.cartTotal.textContent = `${total.toFixed(2)} DT`
  }

  showAddToCartMessage(itemName) {
    // Create a temporary success message
    const message = document.createElement("div")
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10001;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `
    message.textContent = `"${itemName}" ajouté au panier`

    document.body.appendChild(message)

    // Animate in
    setTimeout(() => {
      message.style.transform = "translateX(0)"
    }, 100)

    // Remove after 3 seconds
    setTimeout(() => {
      message.style.transform = "translateX(100%)"
      setTimeout(() => {
        document.body.removeChild(message)
      }, 300)
    }, 3000)
  }

  getCartCount() {
    return this.cart.reduce((count, item) => count + item.quantity, 0)
  }
}

class FavoritesManager {
  constructor() {
    this.favorites = JSON.parse(localStorage.getItem("favorites")) || []
    this.favoritesModal = document.getElementById("favoritesModal")
    this.favoritesIcon = document.querySelector('.icon-btn[aria-label="Favoris"]')
    this.favoritesClose = document.querySelector(".favorites-close")
    this.emptyFavorites = document.getElementById("emptyFavorites")
    this.favoritesItems = document.getElementById("favoritesItems")
    this.favoritesItemsList = document.querySelector(".favorites-items-list")

    this.init()
  }

  init() {
    if (!this.favoritesModal) return

    // Open favorites when favorites icon is clicked
    if (this.favoritesIcon) {
      this.favoritesIcon.addEventListener("click", () => this.openFavorites())
    }

    // Close favorites events
    if (this.favoritesClose) {
      this.favoritesClose.addEventListener("click", () => this.closeFavorites())
    }

    // Close favorites when clicking outside
    this.favoritesModal.addEventListener("click", (e) => {
      if (e.target === this.favoritesModal) {
        this.closeFavorites()
      }
    })

    // Close favorites with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.favoritesModal.style.display === "block") {
        this.closeFavorites()
      }
    })

    this.updateFavoritesDisplay()
    this.updateFavoriteButtons()
  }

  openFavorites() {
    this.favoritesModal.style.display = "block"
    document.body.style.overflow = "hidden"
    this.updateFavoritesDisplay()
  }

  closeFavorites() {
    this.favoritesModal.style.display = "none"
    document.body.style.overflow = "auto"
  }

  addItem(name, price, image = "/placeholder.svg?height=150&width=150") {
    const existingItem = this.favorites.find((item) => item.name === name)

    if (!existingItem) {
      this.favorites.push({
        id: Date.now(),
        name: name,
        price: Number.parseFloat(price),
        image: image,
      })

      this.saveFavorites()
      this.updateFavoritesDisplay()
      this.updateFavoriteButtons()
      this.showAddToFavoritesMessage(name)
    }
  }

  removeItem(id) {
    this.favorites = this.favorites.filter((item) => item.id !== id)
    this.saveFavorites()
    this.updateFavoritesDisplay()
    this.updateFavoriteButtons()
  }

  isInFavorites(name) {
    return this.favorites.some((item) => item.name === name)
  }

  saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(this.favorites))
  }

  updateFavoritesDisplay() {
    if (this.favorites.length === 0) {
      this.emptyFavorites.style.display = "block"
      this.favoritesItems.style.display = "none"
    } else {
      this.emptyFavorites.style.display = "none"
      this.favoritesItems.style.display = "block"
      this.renderFavoritesItems()
    }
  }

  renderFavoritesItems() {
    this.favoritesItemsList.innerHTML = ""

    this.favorites.forEach((item) => {
      const favoritesItemElement = document.createElement("div")
      favoritesItemElement.className = "favorites-item"
      favoritesItemElement.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="favorites-item-image">
        <div class="favorites-item-details">
          <div class="favorites-item-name">${item.name}</div>
          <div class="favorites-item-price">${item.price.toFixed(2)} DT</div>
          <div class="favorites-item-actions">
            <button class="add-to-cart-from-favorites" onclick="addToCart('${item.name}', ${item.price}, '${item.image}')">
              Ajouter au panier
            </button>
            <button class="remove-from-favorites" onclick="favoritesManager.removeItem(${item.id})" title="Supprimer des favoris">
              ♥
            </button>
          </div>
        </div>
      `
      this.favoritesItemsList.appendChild(favoritesItemElement)
    })
  }

  updateFavoriteButtons() {
    // Update all favorite buttons on the page
    document.querySelectorAll(".add-to-favorites-btn").forEach((btn) => {
      const tireName = btn.getAttribute("onclick").match(/'([^']+)'/)[1]
      if (this.isInFavorites(tireName)) {
        btn.classList.add("active")
        btn.style.background = "#ffd700"
        btn.style.color = "#2c1810"
      } else {
        btn.classList.remove("active")
        btn.style.background = "none"
        btn.style.color = "#ffd700"
      }
    })
  }

  showAddToFavoritesMessage(itemName) {
    // Create a temporary success message
    const message = document.createElement("div")
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10001;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `
    message.textContent = `"${itemName}" ajouté aux favoris`

    document.body.appendChild(message)

    // Animate in
    setTimeout(() => {
      message.style.transform = "translateX(0)"
    }, 100)

    // Remove after 3 seconds
    setTimeout(() => {
      message.style.transform = "translateX(100%)"
      setTimeout(() => {
        document.body.removeChild(message)
      }, 300)
    }, 3000)
  }

  getFavoritesCount() {
    return this.favorites.length
  }
}

// Global cart and favorites manager instances
let cartManager
let favoritesManager

// Global function to add items to cart (called from HTML)
function addToCart(name, price, image) {
  if (cartManager) {
    cartManager.addItem(name, price, image)
  }
}

function addToFavorites(name, price, image) {
  if (favoritesManager) {
    const btn = event.target
    if (favoritesManager.isInFavorites(name)) {
      // Remove from favorites
      const item = favoritesManager.favorites.find((item) => item.name === name)
      if (item) {
        favoritesManager.removeItem(item.id)
      }
    } else {
      // Add to favorites
      favoritesManager.addItem(name, price, image)
    }
  }
}

function openFavoritesModal() {
  if (favoritesManager) {
    favoritesManager.openFavorites()
  }
}

// Initialize all functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TireConfigurator()
  new HeaderScroll()
  new ScrollAnimations()
  new MobileMenu()
  new AuthModal()

  cartManager = new CartManager()
  favoritesManager = new FavoritesManager()

  // Add mobile menu styles
  const style = document.createElement("style")
  style.textContent = `
        @media (max-width: 768px) {
            .nav {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                flex-direction: column;
                padding: 20px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                transform: translateY(-100%);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .nav.mobile-open {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
            }
            
            .nav-link {
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }
            
            .nav-link:last-child {
                border-bottom: none;
            }
        }
    `
  document.head.appendChild(style)
})

// Smooth page loading
window.addEventListener("load", () => {
  document.body.style.opacity = "1"
  document.body.style.transition = "opacity 0.5s ease"
})

// Add initial body styles
document.body.style.opacity = "0"
