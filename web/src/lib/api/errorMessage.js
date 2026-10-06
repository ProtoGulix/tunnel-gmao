export function extractApiErrorMessage(error, fallback = 'Une erreur est survenue') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const data = error?.response?.data;

  // detail peut être string | array | objet (FastAPI/Pydantic variés)
  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (typeof first?.msg === 'string' && first.msg.trim()) return first.msg;
    if (typeof first?.message === 'string' && first.message.trim()) return first.message;
  }

  if (data?.detail && typeof data.detail === 'object') {
    if (typeof data.detail.message === 'string' && data.detail.message.trim()) {
      return data.detail.message;
    }
    if (typeof data.detail.msg === 'string' && data.detail.msg.trim()) {
      return data.detail.msg;
    }
    if (typeof data.detail.error === 'string' && data.detail.error.trim()) {
      return data.detail.error;
    }
  }

  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (typeof first?.message === 'string' && first.message.trim()) return first.message;
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;

  return fallback;
}
