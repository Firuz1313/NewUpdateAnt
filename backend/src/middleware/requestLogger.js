import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функция для получения IP адреса клиента
const getClientIP = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
};

// Функция для получения размера тела запроса
const getRequestSize = (req) => {
  const contentLength = req.headers['content-length'];
  return contentLength ? parseInt(contentLength) : 0;
};

// Функция для форматирования размера в человеко-читаемом виде
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Функция записи лога в файл
const writeLogToFile = (logEntry) => {
  if (process.env.LOG_LEVEL === 'none' || process.env.NODE_ENV === 'test') {
    return;
  }
  
  const logDir = path.join(__dirname, '../../logs');
  
  // Создаем папку logs если не существует
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, 'access.log');
  
  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Ошибка записи в лог файл доступа:', error.message);
  }
};

// Основной middleware для логирования запросов
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Генерируем уникальный ID для запроса
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Логируем начало запроса в development режиме
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_ROUTES === 'true') {
    console.log(`🔄 ${req.method} ${req.url} - ${getClientIP(req)} [${req.id}]`);
  }
  
  // Перехватываем оригинальный метод res.end
  const originalEnd = res.end;
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseSize = 0;
  
  // Переопределяем res.end для захвата размера ответа
  res.end = function(chunk, encoding) {
    if (chunk && typeof chunk !== 'function') {
      responseSize += Buffer.byteLength(chunk, encoding || 'utf8');
    }
    originalEnd.call(this, chunk, encoding);
  };
  
  // Переопределяем res.send
  res.send = function(body) {
    if (body) {
      responseSize += Buffer.byteLength(JSON.stringify(body), 'utf8');
    }
    originalSend.call(this, body);
  };
  
  // Переопределяем res.json
  res.json = function(obj) {
    if (obj) {
      responseSize += Buffer.byteLength(JSON.stringify(obj), 'utf8');
    }
    originalJson.call(this, obj);
  };
  
  // Обработчик завершения ответа
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const clientIP = getClientIP(req);
    const requestSize = getRequestSize(req);
    
    // Определяем цвет для статуса в консоли
    let statusColor = '';
    if (res.statusCode >= 200 && res.statusCode < 300) {
      statusColor = '\x1b[32m'; // зеленый
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      statusColor = '\x1b[33m'; // желтый
    } else if (res.statusCode >= 400 && res.statusCode < 500) {
      statusColor = '\x1b[31m'; // красный
    } else if (res.statusCode >= 500) {
      statusColor = '\x1b[35m'; // пурпурный
    }
    
    // Создаем объект лога
    const logEntry = {
      timestamp,
      requestId: req.id,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers.referer || '-',
      requestSize: formatBytes(requestSize),
      responseSize: formatBytes(responseSize),
      contentType: res.getHeader('content-type') || '-'
    };
    
    // Логируем в консоль
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${statusColor}%s\x1b[0m %s %s - %s %s [%s]`,
        res.statusCode,
        req.method,
        req.url,
        duration + 'ms',
        clientIP,
        req.id
      );
    } else {
      // В продакшене более компактный формат
      console.log(
        `${timestamp} - ${req.method} ${req.url} ${res.statusCode} ${duration}ms - ${clientIP}`
      );
    }
    
    // Записываем в файл лога
    writeLogToFile(logEntry);
    
    // Предупреждаем о медленных запросах
    if (duration > 1000) {
      console.warn(`⚠️  Медленный запрос: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // Предупреждаем о больших ответах
    if (responseSize > 1024 * 1024) { // > 1MB
      console.warn(`⚠️  Большой ответ: ${req.method} ${req.url} - ${formatBytes(responseSize)}`);
    }
  });
  
  // Обработчик ошибок соединения
  res.on('error', (error) => {
    console.error(`🚨 Ошибка ответа для ${req.method} ${req.url}:`, error.message);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: req.id,
      method: req.method,
      url: req.url,
      error: error.message,
      clientIP: getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown'
    };
    
    writeLogToFile(logEntry);
  });
  
  next();
};

export default requestLogger;
