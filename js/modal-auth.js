/**
 * RUMAGO.id - Authentication Modal Handler
 * Uses event delegation to avoid timing issues
 */

(function() {
  'use strict';

  // Use event delegation on document
  document.addEventListener('click', function(e) {
    const target = e.target;

    // Open Login Modal
    if (target.id === 'loginButton' || target.closest('#loginButton')) {
      e.preventDefault();
      openModal('loginModal');
    }

    // Open Register Modal
    if (target.id === 'registerButton' || target.closest('#registerButton')) {
      e.preventDefault();
      openModal('registerModal');
    }

    // Close modals
    if (target.id === 'closeLoginModal' || target.id === 'cancelLogin') {
      e.preventDefault();
      closeModal('loginModal');
    }

    if (target.id === 'closeRegisterModal' || target.id === 'cancelRegister') {
      e.preventDefault();
      closeModal('registerModal');
    }

    // Close modal when clicking outside
    if (target.classList.contains('modal')) {
      closeModal(target.id);
    }

    // Handle role selection - Login
    if (target.closest('.role-card') && target.closest('#loginModal')) {
      const card = target.closest('.role-card');
      const modal = document.getElementById('loginModal');
      if (modal) {
        modal.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const role = card.dataset.role;
        const hiddenInput = modal.querySelector('#loginRole');
        if (hiddenInput) hiddenInput.value = role;
      }
    }

    // Handle role selection - Register
    if (target.closest('.role-card') && target.closest('#registerModal')) {
      const card = target.closest('.role-card');
      const modal = document.getElementById('registerModal');
      if (modal) {
        modal.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const role = card.dataset.role;
        const hiddenInput = modal.querySelector('#registerRole');
        if (hiddenInput) hiddenInput.value = role;

        // Show/hide developer fields
        const developerFields = document.getElementById('developerFields');
        if (developerFields) {
          developerFields.style.display = role === 'developer' ? 'block' : 'none';
        }
      }
    }

    // Submit Login
    if (target.id === 'submitLogin') {
      e.preventDefault();
      handleLogin();
    }

    // Submit Register
    if (target.id === 'submitRegister') {
      e.preventDefault();
      handleRegister();
    }

    // Logout
    if (target.id === 'logoutButton') {
      e.preventDefault();
      handleLogout();
    }
  });

  // Handle ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal('loginModal');
      closeModal('registerModal');
    }
  });

  // Open Modal
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal #${modalId} not found`);
      return;
    }
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log(`✅ Opened modal: ${modalId}`);
  }

  // Close Modal
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('show');
    document.body.style.overflow = '';

    // Reset forms
    const form = modal.querySelector('form');
    if (form) form.reset();

    // Reset role selection
    modal.querySelectorAll('.role-card').forEach(card => {
      card.classList.remove('selected');
    });

    // Hide developer fields if register modal
    if (modalId === 'registerModal') {
      const developerFields = document.getElementById('developerFields');
      if (developerFields) developerFields.style.display = 'none';
    }

    console.log(`✅ Closed modal: ${modalId}`);
  }

  // Handle Login
  function handleLogin() {
    const role = document.getElementById('loginRole')?.value;
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    // Validation
    if (!role) {
      alert('Silakan pilih role terlebih dahulu (Customer atau Developer)');
      return;
    }

    if (!email || !password) {
      alert('Email dan password harus diisi');
      return;
    }

    if (!email.includes('@')) {
      alert('Format email tidak valid');
      return;
    }

    console.log('Login:', { role, email });

    // Simulate successful login
    alert(`Login berhasil sebagai ${role === 'customer' ? 'Customer' : 'Developer'}!`);

    // Store user data (temporary - replace with actual auth)
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', email.split('@')[0]);
    localStorage.setItem('isLoggedIn', 'true');

    // Close modal and update UI
    closeModal('loginModal');
    updateAuthUI();
  }

  // Handle Register
  function handleRegister() {
    const role = document.getElementById('registerRole')?.value;
    const name = document.getElementById('registerName')?.value;
    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
    const company = document.getElementById('registerCompany')?.value;
    const association = document.getElementById('registerAssociation')?.value;

    // Validation
    if (!role) {
      alert('Silakan pilih role terlebih dahulu (Customer atau Developer)');
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      alert('Semua field harus diisi');
      return;
    }

    if (!email.includes('@')) {
      alert('Format email tidak valid');
      return;
    }

    if (password !== confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    if (role === 'developer' && !company) {
      alert('Nama perusahaan harus diisi untuk developer');
      return;
    }

    console.log('Register:', { role, name, email, company, association });

    // Simulate successful registration
    alert(`Registrasi berhasil! Selamat datang, ${name}!`);

    // Store user data (temporary - replace with actual auth)
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');

    // Close modal and update UI
    closeModal('registerModal');
    updateAuthUI();
  }

  // Handle Logout
  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isLoggedIn');
      updateAuthUI();
      alert('Anda telah keluar');
    }
  }

  // Update Auth UI
  function updateAuthUI() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (isLoggedIn) {
      const name = localStorage.getItem('userName') || localStorage.getItem('userEmail')?.split('@')[0] || 'User';

      if (authButtons) authButtons.style.display = 'none';
      if (userInfo) userInfo.style.display = 'flex';
      if (userName) userName.textContent = name;
      if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();
    } else {
      if (authButtons) authButtons.style.display = 'flex';
      if (userInfo) userInfo.style.display = 'none';
    }
  }

  // Initialize on page load
  function init() {
    console.log('🔐 Auth modal handler initialized');
    updateAuthUI();
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
