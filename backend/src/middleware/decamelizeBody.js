import humps from 'humps';

/**
 * Middleware для преобразования camelCase ключей в snake_case
 * Решает проблему несоответствия имён полей между frontend (camelCase) и backend (snake_case)
 */
const decamelizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    // Преобразуем ключи из camelCase в snake_case
    req.body = humps.decamelizeKeys(req.body, {
      separator: '_',
      process: (key, convert) => {
        // Не преобразовываем ключи, которые уже в snake_case или специальные ключи
        if (key.includes('_') || key.toLowerCase() === key) {
          return key;
        }
        return convert(key);
      }
    });
    
    // Логируем для отладки в dev режиме
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [decamelizeBody] Converted request body keys to snake_case');
    }
  }
  next();
};

export default decamelizeBody;
