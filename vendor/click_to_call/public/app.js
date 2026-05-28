const $ = (sel) => document.querySelector(sel);

const modal = $('#modal');
const openBtn = $('#open-modal');
const closeBtn = $('#close-modal');
const form = $('#call-form');
const submitBtn = $('#submit');
const phoneInput = $('#phone');
const nameInput = $('#name');
const consentInput = $('#consent');
const feedback = $('#feedback');

const E164_REGEX = /^[1-9]\d{7,14}$/;

function openModal() {
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  phoneInput.focus();
}

function closeModal() {
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  resetForm();
}

function resetForm() {
  form.reset();
  feedback.hidden = true;
  feedback.className = 'feedback';
  feedback.textContent = '';
  submitBtn.disabled = false;
  submitBtn.textContent = 'Llamadme ahora';
}

function showFeedback(kind, message) {
  feedback.hidden = false;
  feedback.className = `feedback ${kind}`;
  feedback.textContent = message;
}

function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return /^\d{9}$/.test(digits) ? `34${digits}` : digits;
}

openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  feedback.hidden = true;

  const phone = normalizePhone(phoneInput.value);
  if (!E164_REGEX.test(phone)) {
    showFeedback('error', 'Introduce un número de teléfono válido (formato internacional, ej. +34 600 000 000).');
    phoneInput.focus();
    return;
  }
  if (!consentInput.checked) {
    showFeedback('error', 'Necesitamos tu consentimiento para llamarte.');
    consentInput.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';

  try {
    const res = await fetch('/api/click-to-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        name: nameInput.value.trim() || null,
        consent: true,
      }),
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.ok) {
      showFeedback('success', data.message ?? 'Te llamamos en unos segundos.');
      submitBtn.textContent = 'Solicitud enviada';
      // El botón queda deshabilitado para evitar reenvíos accidentales.
      return;
    }

    const msg = data?.message ?? 'No hemos podido procesar tu solicitud. Inténtalo de nuevo en unos minutos.';
    showFeedback('error', msg);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Llamadme ahora';
  } catch (err) {
    showFeedback('error', 'Error de conexión. Comprueba tu red e inténtalo de nuevo.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Llamadme ahora';
  }
});
