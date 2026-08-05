export function notFound(request, response) {
  response.status(404).json({ message: `المسار غير موجود: ${request.originalUrl}` });
}

export function errorHandler(error, _request, response, _next) {
  console.error(error);
  const validationError = error.name === 'ValidationError' || error.name === 'CastError';
  response.status(validationError ? 400 : 500).json({ message: validationError ? 'البيانات المرسلة غير صالحة' : 'حدث خطأ في الخادم' });
}
