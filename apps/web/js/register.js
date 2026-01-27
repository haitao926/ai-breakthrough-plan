const { registerUser, loginUser, getAuthUser } = window.auth;

const form = document.getElementById('registerForm');
const statusEl = document.getElementById('registerStatus');
const roleSelect = document.getElementById('roleSelect');
const inviteCodeWrap = document.getElementById('inviteCodeWrap');

function toggleInviteCode() {
  if (roleSelect.value === 'teacher' || roleSelect.value === 'judge') {
    inviteCodeWrap.classList.remove('hidden');
  } else {
    inviteCodeWrap.classList.add('hidden');
  }
}

function redirectAfterRegister(user) {
  window.location.href = (user.role === 'teacher' || user.role === 'judge') ? 'teacher.html' : 'workspace.html';
}

toggleInviteCode();
roleSelect.addEventListener('change', toggleInviteCode);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusEl.textContent = '注册中...';
  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    inviteCode: formData.get('inviteCode')
  };

  try {
    const user = await registerUser(payload);
    if (!getAuthUser()) {
      await loginUser(payload.email, payload.password);
    }
    statusEl.textContent = '注册成功，正在跳转...';
    redirectAfterRegister(user);
  } catch (err) {
    statusEl.textContent = `注册失败：${err.message}`;
  }
});
