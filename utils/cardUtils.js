/**
 * Utilidades para el manejo seguro de números de tarjetas de crédito
 * @file cardUtils.js
 */

/**
 * Enmascara un número de tarjeta de crédito mostrando solo los primeros 4 y últimos 4 dígitos
 * @param {string} cardNumber - Número de tarjeta (con o sin espacios)
 * @returns {string} - Tarjeta enmascarada (ej: 4111XXXXXXXX1111)
 * @throws {Error} - Si el número de tarjeta es inválido
 */
const maskCardNumber = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    throw new Error('Número de tarjeta requerido');
  }

  const cleanNumber = cardNumber.replace(/\D/g, '');

  if (cleanNumber.length < 8) {
    throw new Error('Número de tarjeta debe tener al menos 8 dígitos');
  }

  if (cleanNumber.length > 19) {
    throw new Error('Número de tarjeta demasiado largo');
  }

  const firstFour = cleanNumber.substring(0, 4);
  const lastFour = cleanNumber.substring(cleanNumber.length - 4);

  const middleLength = cleanNumber.length - 8;
  const maskingXs = 'X'.repeat(middleLength);

  return `${firstFour}${maskingXs}${lastFour}`;
};

/**
 * Detecta el tipo de tarjeta basado en los primeros dígitos
 * @param {string} cardNumber - Número de tarjeta
 * @returns {string} - Tipo de tarjeta (VISA, MASTERCARD, AMEX, etc.)
 */
const detectCardType = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, '');

  if (cleanNumber.startsWith('4')) {
    return 'VISA';
  } else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
    return 'MASTERCARD';
  } else if (cleanNumber.startsWith('3')) {
    if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) {
      return 'AMEX';
    }
    return 'DINERS';
  } else if (cleanNumber.startsWith('6')) {
    return 'DISCOVER';
  }

  return 'UNKNOWN';
};

/**
 * Valida un número de tarjeta usando el algoritmo de Luhn
 * @param {string} cardNumber - Número de tarjeta
 * @returns {boolean} - true si es válido, false si no
 */
const validateCardNumber = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, '');

  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Formatea un número de tarjeta con espacios para mejor legibilidad
 * @param {string} cardNumber - Número de tarjeta
 * @returns {string} - Número formateado (ej: 4111 1111 1111 1111)
 */
const formatCardNumber = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

/**
 * Función de prueba para verificar que el enmascarado funciona correctamente
 */
const testMaskFunction = () => {
  console.log('🧪 Probando función de enmascarado:');

  const testCards = [
    '4111111111111111',
    '5555 5555 5555 4444',
    '378282246310005',
    '6011111111111117'
  ];

  testCards.forEach(card => {
    try {
      const masked = maskCardNumber(card);
      const type = detectCardType(card);
      const isValid = validateCardNumber(card);
      console.log(`${card} → ${masked} (${type}) - Válida: ${isValid}`);
    } catch (error) {
      console.log(`${card} → Error: ${error.message}`);
    }
  });
};

// Exportar las funciones
module.exports = {
  maskCardNumber,
  detectCardType,
  validateCardNumber,
  formatCardNumber,
  testMaskFunction
};

