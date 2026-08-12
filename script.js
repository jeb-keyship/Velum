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
  const monthField = document.getElementById('departure-month');
  const dayField = document.getElementById('departure-day');
  const yearField = document.getElementById('departure-year');
  const timeField = document.getElementById('departure-time-eastern');
  const gmtDisplay = document.getElementById('gmt-time-display');
  const nowBtn = document.getElementById('use-now-btn');

  const MAX_AHEAD_MS = 7 * 24 * 60 * 60 * 1000;

  function partsInZone(date, timeZone) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = {};
    fmt.formatToParts(date).forEach(p => { if (p.type !== 'literal') parts[p.type] = p.value; });
    let hour = parseInt(parts.hour, 10);
    if (hour === 24) hour = 0;
    return {
      year: parseInt(parts.year, 10),
      month: parseInt(parts.month, 10),
      day: parseInt(parts.day, 10),
      hour, minute: parseInt(parts.minute, 10)
    };
  }

  function easternToUTC(year, month, day, hour, minute) {
    for (const offsetHours of [4, 5]) {
      const guess = new Date(Date.UTC(year, month - 1, day, hour + offsetHours, minute, 0));
      const check = partsInZone(guess, 'America/New_York');
      if (check.year === year && check.month === month && check.day === day &&
          check.hour === hour && check.minute === minute) {
        return guess;
      }
    }
    return new Date(Date.UTC(year, month - 1, day, hour + 4, minute, 0));
  }

  function selectedUTCDate() {
    if (!monthField.value || !dayField.value || !yearField.value || !timeField.value) return null;
    const [hh, mm] = timeField.value.replace(' ET', '').split(':').map(Number);
    return easternToUTC(
      parseInt(yearField.value, 10),
      parseInt(monthField.value, 10),
      parseInt(dayField.value, 10),
      hh, mm
    );
  }

  function isDepartureInPast() {
    const selected = selectedUTCDate();
    if (!selected) return false;
    return selected.getTime() < Date.now();
  }

  function isDepartureTooFarFuture() {
    const selected = selectedUTCDate();
    if (!selected) return false;
    return selected.getTime() > (Date.now() + MAX_AHEAD_MS);
  }

  function updateGMTDisplay() {
    const selected = selectedUTCDate();
    if (!selected) {
      gmtDisplay.textContent = 'Select a date and time above';
      return;
    }
    const formatted = selected.toLocaleString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    gmtDisplay.textContent = formatted + ' (GMT)';
  }

  function fillCurrentDateTime() {
    const now = new Date();
    const et = partsInZone(now, 'America/New_York');

    const scratch = new Date(Date.UTC(et.year, et.month - 1, et.day, et.hour, et.minute, 0));
    let roundedMinutes = Math.round(scratch.getUTCMinutes() / 6) * 6;
    scratch.setUTCMinutes(roundedMinutes);

    const year = scratch.getUTCFullYear();
    const month = String(scratch.getUTCMonth() + 1).padStart(2, '0');
    const day = String(scratch.getUTCDate()).padStart(2, '0');
    const hh = scratch.getUTCHours();
    const mm = scratch.getUTCMinutes();
    const timeLabel = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ET`;

    monthField.value = month;
    dayField.value = day;
    yearField.value = String(year);

    const timeOption = Array.from(timeField.options).find(o => o.text === timeLabel);
    if (timeOption) timeField.value = timeOption.value;

    updateGMTDisplay();
  }

  [monthField, dayField, yearField, timeField].forEach(field => {
    if (field) field.addEventListener('change', updateGMTDisplay);
  });

  fillCurrentDateTime();

  if (nowBtn) {
    nowBtn.addEventListener('click', () => {
      fillCurrentDateTime();
      errorMsg.style.display = 'none';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';

      if (isDepartureInPast()) {
        errorMsg.textContent = 'Departure date/time must be now or in the future. Please pick a valid date and time.';
        errorMsg.style.display = 'block';
        return;
      }

      if (isDepartureTooFarFuture()) {
        errorMsg.textContent = 'Departure date/time must be within the next 7 days. Please pick a valid date and time.';
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
      fillCurrentDateTime();
    });
  }
});
