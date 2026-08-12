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
  const dateField = document.getElementById('departure-date');
  const timeField = document.getElementById('departure-time-gmt');

  function nowGMT() {
    const now = new Date();
    return new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  }

  if (dateField) {
    const gmt = nowGMT();
    const todayStr = gmt.toISOString().slice(0, 10);
    dateField.setAttribute('min', todayStr);
  }

  function isDepartureInPast() {
    if (!dateField.value || !timeField.value) return false;
    const [hh, mm] = timeField.value.replace(' GMT', '').split(':').map(Number);
    const selected = new Date(dateField.value + 'T00:00:00Z');
    selected.setUTCHours(hh, mm, 0, 0);
    return selected.getTime() < nowGMT().getTime();
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';

      if (isDepartureInPast()) {
        errorMsg.textContent = 'Departure date/time must be now or in the future (GMT). Please pick a valid time.';
        errorMsg.style.display = 'block';
        return;
      }

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
          errorMsg.textContent = 'Something went wrong — please try again or email jeb@velumtech.com directly.';
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Request';
        }
      } catch (err) {
        errorMsg.textContent = 'Something went wrong — please try again or email jeb@velumtech.com directly.';
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
