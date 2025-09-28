export async function signInUI() {
  const overlay = document.getElementById('login-overlay');
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-pass');
  const login = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  const cancel = document.getElementById('login-guest');

  login.onclick = async () => {
    err.style.display = 'none';
    try {
        await firebase.auth().signInWithEmailAndPassword(emailEl.value.trim(), passEl.value);
        overlay.style.display = 'none';
    } catch (e) {
      err.textContent = e.message.startsWith('{') ? 'Sign in failed' : e.message;
      err.style.display = 'block';
    }
  };
  cancel.onclick = () => {
    overlay.style.display = 'none';
  };
}

export function addLoginUIEventListener() {
    var loginOverlay = document.getElementById('login-overlay');
    var openLoginBtn = document.getElementById('open-login-btn');
    if (openLoginBtn && loginOverlay) {
      openLoginBtn.addEventListener('click', function() {
        loginOverlay.style.display = 'flex';
      });
    }
    // Optionally hide overlay on "Cancel"
    var loginGuest = document.getElementById('login-guest');
    if (loginGuest && loginOverlay) {
      loginGuest.addEventListener('click', function() {
        loginOverlay.style.display = 'none';
      });
    }
}