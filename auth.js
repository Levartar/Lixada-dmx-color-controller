export async function signInUI() {
  const overlay = document.getElementById('login-overlay');
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-pass');
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  const cancel = document.getElementById('login-guest');

  btn.onclick = async () => {
    err.style.display = 'none';
    try {
      await firebase.auth().signInWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      // success -> onAuthStateChanged will hide overlay and init
    } catch (e) {
      err.textContent = e.message || 'Sign in failed';
      err.style.display = 'block';
    }
  };
  cancel.onclick = () => {
    // optional: hide overlay and keep UI disabled
    overlay.style.display = 'none';
  };
}