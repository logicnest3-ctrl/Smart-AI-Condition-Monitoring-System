/**
 * PulseGuard AI - Global Interactive Scripts
 * Handles navigation dropdowns, mobile drawer, demo modal, form validation, and loading states.
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Mobile Menu Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      if (menuIcon && closeIcon) {
        if (isOpen) {
          menuIcon.classList.add('hidden');
          closeIcon.classList.remove('hidden');
        } else {
          menuIcon.classList.remove('hidden');
          closeIcon.classList.add('hidden');
        }
      }
    });
  }

  // 2. Features Dropdown Desktop Toggle & Outside Click
  const dropdownParent = document.querySelector('.dropdown-parent');
  const dropdownToggle = document.getElementById('featuresDropdownBtn');
  const dropdownMenu = document.getElementById('featuresDropdownMenu');

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dropdownParent || !dropdownParent.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  }

  // 3. Demo Modal Logic
  const modalOverlay = document.getElementById('demoModal');
  const openDemoBtns = document.querySelectorAll('.btn-open-demo');
  const closeDemoBtn = document.getElementById('closeDemoBtn');

  function openModal() {
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  openDemoBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  if (closeDemoBtn) {
    closeDemoBtn.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  // 4. Contact Form Validation & Realistic Interactive Loading State
  const contactForm = document.getElementById('contactForm');
  const formSuccessState = document.getElementById('formSuccessState');
  const formSubmitBtn = document.getElementById('formSubmitBtn');
  const btnResetForm = document.getElementById('btnResetForm');

  if (contactForm && formSubmitBtn) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Clear previous error states
      const fields = ['contactName', 'contactEmail', 'contactMessage'];
      let hasError = false;

      fields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        const errorMsg = document.getElementById(`${fieldId}Error`);
        if (!input) return;

        if (!input.value.trim()) {
          input.classList.add('border-rose-500', 'focus:border-rose-500');
          if (errorMsg) errorMsg.classList.remove('hidden');
          hasError = true;
        } else {
          input.classList.remove('border-rose-500', 'focus:border-rose-500');
          if (errorMsg) errorMsg.classList.add('hidden');
        }
      });

      // Email format check
      const emailInput = document.getElementById('contactEmail');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailInput && emailInput.value.trim() && !emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('border-rose-500');
        const emailError = document.getElementById('contactEmailError');
        if (emailError) {
          emailError.textContent = 'Please enter a valid work email address.';
          emailError.classList.remove('hidden');
        }
        hasError = true;
      }

      if (hasError) return;

      // Enter interactive loading state
      const originalBtnHtml = formSubmitBtn.innerHTML;
      formSubmitBtn.disabled = true;
      formSubmitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Transmitting Telemetry Inquiry...</span>
      `;

      // Simulate API submission network delay
      setTimeout(() => {
        contactForm.classList.add('hidden');
        if (formSuccessState) {
          formSuccessState.classList.remove('hidden');
        }
        formSubmitBtn.disabled = false;
        formSubmitBtn.innerHTML = originalBtnHtml;
      }, 1200);
    });
  }

  // Reset form to send another message
  if (btnResetForm && contactForm && formSuccessState) {
    btnResetForm.addEventListener('click', () => {
      contactForm.reset();
      formSuccessState.classList.add('hidden');
      contactForm.classList.remove('hidden');
    });
  }

  // 5. Footer Newsletter Form
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterFeedback = document.getElementById('newsletterFeedback');

  if (newsletterForm && newsletterFeedback) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value.includes('@')) {
        newsletterFeedback.textContent = '✓ Subscribed to IIoT Engineering Briefing!';
        newsletterFeedback.className = 'text-xs text-emerald-400 font-mono mt-1.5 block';
        input.value = '';
      }
    });
  }

});
