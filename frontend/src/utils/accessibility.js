// Accessibility utilities and helpers

// Focus management
export const focusManagement = {
  // Trap focus within a container
  trapFocus: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Save and restore focus
  saveFocus: () => {
    const activeElement = document.activeElement;
    return () => {
      if (activeElement && typeof activeElement.focus === 'function') {
        activeElement.focus();
      }
    };
  },

  // Focus first error in form
  focusFirstError: (formElement) => {
    const firstError = formElement.querySelector('[aria-invalid="true"], .error input, .error select, .error textarea');
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

// ARIA live region announcements
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Keyboard navigation helpers
export const keyboardNavigation = {
  // Handle arrow key navigation in lists
  handleArrowKeys: (event, items, currentIndex, onIndexChange) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
      default:
        return;
    }
    
    event.preventDefault();
    onIndexChange(newIndex);
    items[newIndex]?.focus();
  },

  // Handle escape key
  handleEscape: (callback) => (event) => {
    if (event.key === 'Escape') {
      callback();
    }
  },

  // Handle enter and space for custom buttons
  handleActivation: (callback) => (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1, color2) => {
    const lum1 = colorContrast.getLuminance(...color1);
    const lum2 = colorContrast.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1, color2, level = 'AA') => {
    const ratio = colorContrast.getContrastRatio(color1, color2);
    return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
  }
};

// Screen reader utilities
export const screenReader = {
  // Check if screen reader is active
  isActive: () => {
    return window.navigator.userAgent.includes('NVDA') ||
           window.navigator.userAgent.includes('JAWS') ||
           window.speechSynthesis?.speaking ||
           false;
  },

  // Describe element for screen readers
  describe: (element, description) => {
    element.setAttribute('aria-describedby', `desc-${Date.now()}`);
    const descElement = document.createElement('div');
    descElement.id = element.getAttribute('aria-describedby');
    descElement.className = 'sr-only';
    descElement.textContent = description;
    document.body.appendChild(descElement);
  }
};

// Motion preferences
export const motionPreferences = {
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get safe animation duration
  getSafeAnimationDuration: (defaultDuration) => {
    return motionPreferences.prefersReducedMotion() ? 0 : defaultDuration;
  },

  // Create motion-safe transition
  createSafeTransition: (transition) => {
    if (motionPreferences.prefersReducedMotion()) {
      return { duration: 0 };
    }
    return transition;
  }
};

// Form accessibility helpers
export const formAccessibility = {
  // Add error message to field
  addErrorMessage: (field, message) => {
    const errorId = `error-${field.id || Date.now()}`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    field.setAttribute('aria-describedby', errorId);
    field.setAttribute('aria-invalid', 'true');
  },

  // Remove error message from field
  removeErrorMessage: (field) => {
    const errorId = field.getAttribute('aria-describedby');
    if (errorId) {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.remove();
      }
      field.removeAttribute('aria-describedby');
      field.removeAttribute('aria-invalid');
    }
  },

  // Validate and announce form errors
  validateForm: (form) => {
    const errors = [];
    const fields = form.querySelectorAll('input, select, textarea');
    
    fields.forEach(field => {
      if (!field.checkValidity()) {
        errors.push({
          field,
          message: field.validationMessage
        });
      }
    });

    if (errors.length > 0) {
      announceToScreenReader(`Form has ${errors.length} error${errors.length > 1 ? 's' : ''}`, 'assertive');
      focusManagement.focusFirstError(form);
    }

    return errors;
  }
};

// Skip links utility
export const skipLinks = {
  create: (targets) => {
    const skipContainer = document.createElement('div');
    skipContainer.className = 'skip-links';
    
    targets.forEach(({ href, text }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      link.className = 'skip-link';
      skipContainer.appendChild(link);
    });
    
    document.body.insertBefore(skipContainer, document.body.firstChild);
  }
};

// High contrast mode detection
export const highContrast = {
  isActive: () => {
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches;
  },

  applyHighContrastStyles: () => {
    if (highContrast.isActive()) {
      document.body.classList.add('high-contrast');
    }
  }
};

// Export all utilities
export default {
  focusManagement,
  announceToScreenReader,
  keyboardNavigation,
  colorContrast,
  screenReader,
  motionPreferences,
  formAccessibility,
  skipLinks,
  highContrast
};
