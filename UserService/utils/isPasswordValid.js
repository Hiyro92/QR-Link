const isPasswordValid = (value) => {
  if (value.length <= 8) {
    throw new Error("Das Passwort muss länger als 8 Zeichen sein.");
  }
  // Wenn die Validierung erfolgreich ist, muss kein Fehler geworfen werden.
  return true;
};
module.exports = isPasswordValid;
