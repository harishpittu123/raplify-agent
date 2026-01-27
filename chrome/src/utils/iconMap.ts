/**
 * VS Code Icon mapping for file extensions
 * Maps file extensions to Codicon Unicode characters
 * Uses specific language icons matching VS Code's File Explorer
 * Reference: https://github.com/microsoft/vscode-codicons
 */

const extensionIconMap: Record<string, string> = {
  // JavaScript/TypeScript
  js: "\uEAC5", // javascript
  jsx: "\uEA82", // react
  ts: "\uEA9B", // typescript
  tsx: "\uEA82", // react
  mjs: "\uEAC5", // javascript
  cjs: "\uEAC5", // javascript

  // Python
  py: "\uEAC7", // python
  pyw: "\uEAC7", // python
  pyc: "\uEAC7", // python

  // Java
  java: "\uEABC", // java
  jar: "\uEABC", // java

  // C/C++/C#
  cpp: "\uEAAF", // cpp
  cc: "\uEAAF", // cpp
  c: "\uEAAE", // c
  cs: "\uEAAC", // csharp
  csx: "\uEAAC", // csharp

  // Ruby
  rb: "\uEAC4", // ruby
  erb: "\uEAC4", // ruby

  // Go
  go: "\uEAC6", // go

  // Rust
  rs: "\uEAC8", // rust

  // PHP
  php: "\uEAC0", // php
  phtml: "\uEAC0", // php

  // Swift
  swift: "\uEAC9", // swift

  // Kotlin
  kt: "\uEACA", // kotlin
  kts: "\uEACA", // kotlin

  // Scala
  scala: "\uEACB", // scala

  // Groovy
  groovy: "\uEACC", // groovy

  // HTML/Web
  html: "\uEAA8", // html
  htm: "\uEAA8", // html

  // CSS/Styles
  css: "\uEAAD", // css
  scss: "\uEAAE", // scss
  sass: "\uEAAE", // sass
  less: "\uEAAF", // less

  // XML/Markup
  xml: "\uEAD6", // code
  svg: "\uEB5A", // image

  // Data
  json: "\uEB13", // json
  yaml: "\uEAD6", // code
  yml: "\uEAD6", // code
  toml: "\uEAD6", // code
  csv: "\uEAD6", // code
  sql: "\uEAD6", // code

  // Markup/Docs
  md: "\uEBD7", // markdown
  mdx: "\uEBD7", // markdown
  txt: "\uEAB5", // file

  // Config
  env: "\uEB5F", // gear
  config: "\uEB5F", // gear
  conf: "\uEB5F", // gear
  ini: "\uEB5F", // gear

  // Package
  package: "\uEA83", // package
  lock: "\uEBA6", // lock
  gem: "\uEAC4", // ruby

  // Build/Shell
  dockerfile: "\uEAD6", // code
  makefile: "\uEAD6", // code
  gradle: "\uEAD6", // code
  maven: "\uEAD6", // code
  sh: "\uEAD6", // code
  bash: "\uEAD6", // code
  zsh: "\uEAD6", // code
  fish: "\uEAD6", // code
  ps1: "\uEAD6", // code

  // Default
  default: "\uEAB5", // file
};

export function getIconForFile(fileName: string): string {
  // Get extension without the dot
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (!ext) {
    return extensionIconMap.default;
  }

  // Check direct extension match
  if (extensionIconMap[ext]) {
    return extensionIconMap[ext];
  }

  // Check special cases
  if (fileName === "dockerfile") return "\uEAD6"; // code
  if (fileName === "makefile") return "\uEAD6"; // code
  if (fileName === "gemfile") return "\uEAC4"; // ruby
  if (fileName.includes("package.json")) return "\uEA83"; // package
  if (fileName.includes("package-lock.json")) return "\uEBA6"; // lock
  if (fileName.includes(".env")) return "\uEB5F"; // gear

  return extensionIconMap.default;
}

export function getIconClass(fileName: string): string {
  const icon = getIconForFile(fileName);
  return icon;
}

export const folderIcon = "\uEAA0"; // folder (closed)
export const folderOpenIcon = "\uEADF"; // folder-opened
