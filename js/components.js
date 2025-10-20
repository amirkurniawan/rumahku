/**
 * RumahSubsidi.id - Reusable Components Loader
 * Load Navbar & Footer from separate HTML files
 */

// Load Navbar
async function loadNavbar() {
  try {
    const response = await fetch('/components/navbar.html');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const placeholder = document.getElementById('navbar-placeholder');
    
    if (placeholder) {
      placeholder.innerHTML = html;
      
      // Set active menu after navbar loaded
      setTimeout(() => {
        setActiveMenu();
      }, 100);
    }
  } catch (error) {
    console.error('Error loading navbar:', error);
    
    // Fallback: Show error message
    const placeholder = document.getElementById('navbar-placeholder');
    if (placeholder) {
      placeholder.innerHTML = '<div style="padding: 1rem; background: #f8d7da; color: #721c24;">Error loading navbar. Please refresh.</div>';
    }
  }
}

// Load Footer
async function loadFooter() {
  try {
    const response = await fetch('/components/footer.html');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const placeholder = document.getElementById('footer-placeholder');
    
    if (placeholder) {
      placeholder.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading footer:', error);
    
    // Fallback: Show simple footer
    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
      placeholder.innerHTML = '<footer style="padding: 2rem; text-align: center; background: #3b506c; color: white;">&copy; 2025 RUMAGO.id</footer>';
    }
  }
}

// Set Active Menu based on current page
function setActiveMenu() {
  const currentPage = window.location.pathname;
  
  // Get all nav links
  const navLinks = document.querySelectorAll('nav a');
  
  // Remove all active classes first
  navLinks.forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to current page
  if (currentPage === '/' || currentPage === '/index.html' || currentPage.endsWith('/')) {
    const homeLink = document.getElementById('nav-home');
    if (homeLink) homeLink.classList.add('active');
  } else if (currentPage.includes('search.html') || currentPage.includes('search')) {
    const searchLink = document.getElementById('nav-search');
    if (searchLink) searchLink.classList.add('active');
  }
  
  console.log('Active menu set for:', currentPage);
}

// Load both components when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadNavbar();
    loadFooter();
  });
} else {
  // DOM already loaded
  loadNavbar();
  loadFooter();
}

// Export functions for debugging
window.reloadComponents = function() {
  loadNavbar();
  loadFooter();
};

// Load Modal NIK (tambahkan di bawah loadFooter)
async function loadModalNik() {
    try {
        const response = await fetch('/components/modal-nik.html');
        const html = await response.text();
        
        // Insert before closing body tag
        document.body.insertAdjacentHTML('beforeend', html);
        console.log('Modal NIK loaded');
    } catch (error) {
        console.error('Error loading modal NIK:', error);
    }
}

// Update initialization (ganti yang lama dengan ini)
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Components loader initialized');
    
    await loadNavbar();
    await loadFooter();
    await loadModalNik();
    await loadModalAuth(); // Load auth modals
    
    setActiveMenu();
    
    // Initialize NIK checker setelah modal loaded
    setTimeout(initNikChecker, 100);
});

console.log('Components loader initialized');




// Load Modal Auth (Login & Register)
async function loadModalAuth() {
    try {
        const response = await fetch('/components/modal-auth.html');
        const html = await response.text();
        const placeholder = document.getElementById('modal-auth-placeholder');
        if (placeholder) {
            placeholder.innerHTML = html;
            console.log('Modal Auth loaded');
        }
    } catch (error) {
        console.error('Error loading modal Auth:', error);
    }
}
