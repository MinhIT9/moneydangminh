(() => {
  const logoutButton = document.querySelector('#logout');
  if (!logoutButton) return;
  logoutButton.onclick = () =>
    http.request('/auth/logout', { method: 'POST' }).then(() => (location.href = '/landing'));
})();
