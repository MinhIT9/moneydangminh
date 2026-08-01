window.http = (() => {
  const csrf = document.querySelector('meta[name=csrf-token]').content;
  const cache = new Map();

  function cached(key, loader, ttl = 30000) {
    const hit = cache.get(key);
    const now = Date.now();

    if (hit?.data && now - hit.time < ttl) return Promise.resolve(hit.data);
    if (hit?.pending) return hit.pending;

    const pending = Promise.resolve(loader())
      .then((data) => {
        cache.set(key, { data, time: Date.now() });
        return data;
      })
      .catch((error) => {
        cache.delete(key);
        throw error;
      });

    cache.set(key, { pending, time: hit?.time || 0 });
    return pending;
  }

  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const key = `${method}:${path}`;

    if (method === 'GET') return cached(key, () => requestNetwork(path, options), 15000);

    const data = await requestNetwork(path, options);
    clearCache();
    window.dispatchEvent(new CustomEvent('finance:data-changed', { detail: { path } }));
    return data;
  }

  async function requestNetwork(path, options) {
    const opts = {
      ...options,
      headers: { ...(options.headers || {}), 'X-CSRF-Token': csrf },
    };

    if (opts.body && typeof opts.body !== 'string') {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }

    const response = await fetch(`/api${path}`, opts);

    if (response.status === 401) {
      location.href = '/login';
      throw new Error('Bạn cần đăng nhập');
    }

    const payload = await response
      .json()
      .catch(() => ({ success: false, message: 'Phản hồi không hợp lệ' }));

    if (!payload.success) throw new Error(payload.message || 'Không thể xử lý yêu cầu');
    return payload.data;
  }

  function clearCache() {
    cache.clear();
  }

  return { request, csrf, cached, clearCache };
})();
