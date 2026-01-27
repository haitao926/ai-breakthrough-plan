const { loginUser, getAuthUser } = window.auth;

const form = document.getElementById('loginForm');
const statusEl = document.getElementById('loginStatus');

function redirectAfterLogin(user) {
  const redirect = window.sessionStorage.getItem('auth_redirect');
  if (redirect) {
    window.sessionStorage.removeItem('auth_redirect');
    window.location.href = redirect;
    return;
  }
  window.location.href = (user.role === 'teacher' || user.role === 'judge') ? 'teacher.html' : 'workspace.html';
}

const existingUser = getAuthUser();
if (existingUser) {
  redirectAfterLogin(existingUser);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusEl.textContent = '登录中...';
  const formData = new FormData(form);
  try {
    const user = await loginUser(formData.get('email'), formData.get('password'));
    statusEl.textContent = '登录成功，正在跳转...';
    redirectAfterLogin(user);
  } catch (err) {
    statusEl.textContent = `登录失败：${err.message}`;
  }
});
