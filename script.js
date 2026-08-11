document.addEventListener('DOMContentLoaded', () => {
  const revealTargets = document.querySelectorAll('.feature-card, .approach-item, .section h2, .stat');
  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => observer.observe(el));

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const form = document.getElementById('tryit-form');
  const successBox = document.getElementById('tryit-success');
  const errorMsg = document.getElementById('tryit-error');
  const submitBtn = document.getElementById('tryit-submit-btn');
  const resetBtn = document.getElementById('tryit-reset-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          form.reset();
          form.style.display = 'none';
          successBox.style.display = 'block';
        } else {
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Request';
        }
      } catch (err) {
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Request';
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      successBox.style.display = 'none';
      form.style.display = 'flex';
      form.style.flexDirection = 'column';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Request';
    });
  }
});
