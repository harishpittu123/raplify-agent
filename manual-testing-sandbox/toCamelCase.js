/**
 * Converts any text into camelCase
 * @param {string} text - The input text to convert
 * @returns {string} The camelCase version of the input text
 */
function toCamelCase(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

// Examples
console.log(toCamelCase("hello world")); // helloWorld
console.log(toCamelCase("convert this to camel")); // convertThisToCamel
console.log(toCamelCase("my-variable-name")); // myVariableName
console.log(toCamelCase("my_variable_name")); // myVariableName
console.log(toCamelCase("Hello World Example")); // helloWorldExample

module.exports = toCamelCase;
