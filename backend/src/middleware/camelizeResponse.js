import humps from 'humps';

/**
 * Middleware для преобразования snake_case ключей в camelCase в ответах
 * Решает проблему несоответствия имён полей между backend (snake_case) и frontend (camelCase)
 */
const camelizeResponse = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (data && typeof data === 'object') {
      // Преобразуем ключи из snake_case в camelCase
      const camelizedData = humps.camelizeKeys(data, {
        separator: '_',
        process: (key, convert) => {
          // Не преобразовываем ключи, которые уже в camelCase или специальные ключи
          if (!key.includes('_') || key.toLowerCase() !== key) {
            return key;
          }
          return convert(key);
        }
      });
      
      // Логируем для отладки в dev режиме
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [camelizeResponse] Converted response keys to camelCase');
      }
      
      return originalJson.call(this, camelizedData);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default camelizeResponse;
