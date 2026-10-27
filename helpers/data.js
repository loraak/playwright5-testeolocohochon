const USER = 'practice';
const PASS = 'SuperSecretPassword!';

const sufijo = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const unico = (prefijo = 'qa') => `${prefijo}${sufijo()}`;
const soloDigitos = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

module.exports = { USER, PASS, unico, soloDigitos };
