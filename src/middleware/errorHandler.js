export function notFound(request, response) {
  response.status(404).json({ message: `المسار غير موجود: ${request.originalUrl}` });
}

export function errorHandler(error, _request, response, _next) {
  console.error(error);
  const validationError = error.name === 'ValidationError' || error.name === 'CastError';
  const databaseUnavailable = error.name === 'MongooseServerSelectionError';
  const status = error.status || (validationError ? 400 : databaseUnavailable ? 503 : 500);
  const message = error.status ? error.message : validationError
    ? 'البيانات المرسلة غير صالحة'
    : databaseUnavailable
      ? 'قاعدة البيانات غير متاحة حاليًا. تحقق من إعدادات MongoDB Atlas Network Access.'
      : 'حدث خطأ في الخادم';
  response.status(status).json({ message });
}
