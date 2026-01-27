/**
 * Seti Icon Loader - Renders VS Code Seti icons using seti.woff font
 * Uses vs-seti-icon-theme.json for icon definitions
 */

import iconTheme from "../resources/vs-seti-icon-theme.json";

interface IconDefinition {
  fontCharacter: string;
  fontColor?: string;
}

interface IconInfo {
  char: string;
  color: string;
  id: string;
}

// Parse the Seti icon theme
const iconDefinitions = (iconTheme as any).iconDefinitions as Record<
  string,
  IconDefinition
>;
const fileExtensions = (iconTheme as any).fileExtensions || {};
const fileNames = (iconTheme as any).fileNames || {};
const languageIds = (iconTheme as any).languageIds || {};

// Map file extensions to language IDs for fallback lookup
const extensionToLanguage: Record<string, string> = {
  js: "javascript",
  jsx: "javascriptreact",
  ts: "typescript",
  tsx: "typescriptreact",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  rb: "ruby",
  go: "go",
  rs: "rust",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  scala: "scala",
  groovy: "groovy",
  html: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  xml: "xml",
  svg: "svg",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  csv: "csv",
  sql: "sql",
  md: "markdown",
  mdx: "mdx",
  txt: "plaintext",
  env: "dotenv",
  bash: "shellscript",
  sh: "shellscript",
  zsh: "shellscript",
  fish: "shellscript",
  ps1: "powershell",
  dockerfile: "dockerfile",
};

/**
 * Convert fontCharacter from theme JSON (e.g., "\E001") to actual character
 */
function parseFontCharacter(fontCharacterString: string): string {
  // Remove backslash and convert hex to decimal
  const hexCode = fontCharacterString.replace(/\\/g, "");
  const charCode = parseInt(hexCode, 16);
  return String.fromCharCode(charCode);
}

/**
 * Get the icon character, color, and id for a file based on its name/extension
 */
export function getSetiIcon(fileName: string): IconInfo {
  const lowerName = fileName.toLowerCase();

  // Check exact filename match first
  if (fileNames[lowerName]) {
    const iconKey = fileNames[lowerName];
    const icon = iconDefinitions[iconKey];
    if (icon) {
      return {
        char: parseFontCharacter(icon.fontCharacter),
        color: icon.fontColor || "#ffffff",
        id: iconKey,
      };
    }
  }

  // Check extension match in fileExtensions
  const parts = lowerName.split(".");
  const ext = parts[parts.length - 1];

  if (ext && fileExtensions[ext]) {
    const iconKey = fileExtensions[ext];
    const icon = iconDefinitions[iconKey];
    if (icon) {
      return {
        char: parseFontCharacter(icon.fontCharacter),
        color: icon.fontColor || "#ffffff",
        id: iconKey,
      };
    }
  }

  // Try to find icon via language ID mapping
  if (ext && extensionToLanguage[ext]) {
    const langId = extensionToLanguage[ext];
    if (languageIds[langId]) {
      const iconKey = languageIds[langId];
      const icon = iconDefinitions[iconKey];
      if (icon) {
        return {
          char: parseFontCharacter(icon.fontCharacter),
          color: icon.fontColor || "#ffffff",
          id: iconKey,
        };
      }
    }
  }

  // Check special cases (without dot)
  const nameWithoutDot = lowerName.replace(/^\./, "");
  if (fileNames[nameWithoutDot]) {
    const iconKey = fileNames[nameWithoutDot];
    const icon = iconDefinitions[iconKey];
    if (icon) {
      return {
        char: parseFontCharacter(icon.fontCharacter),
        color: icon.fontColor || "#ffffff",
        id: iconKey,
      };
    }
  }

  // Default file icon
  const defaultFileKey = (iconTheme as any).file || "_default";
  const defaultIcon = iconDefinitions[defaultFileKey];
  if (defaultIcon) {
    return {
      char: parseFontCharacter(defaultIcon.fontCharacter),
      color: defaultIcon.fontColor || "#ffffff",
      id: defaultFileKey,
    };
  }

  return { char: "f", color: "#ffffff", id: "_default" };
}

/**
 * Get icon for closed folders
 */
export function getFolderIcon(): IconInfo {
  const folderKey = (iconTheme as any).folder || "_folder";
  const folderIcon = iconDefinitions[folderKey];
  if (folderIcon) {
    return {
      char: parseFontCharacter(folderIcon.fontCharacter),
      color: folderIcon.fontColor || "#ffffff",
      id: folderKey,
    };
  }
  return { char: "d", color: "#ffffff", id: folderKey };
}

/**
 * Get icon for open folders
 */
export function getFolderOpenIcon(): IconInfo {
  const folderOpenKey = (iconTheme as any).folderExpanded || "_folder_open";
  const folderOpenIcon = iconDefinitions[folderOpenKey];
  if (folderOpenIcon) {
    return {
      char: parseFontCharacter(folderOpenIcon.fontCharacter),
      color: folderOpenIcon.fontColor || "#ffffff",
      id: folderOpenKey,
    };
  }
  // Fallback to regular folder if open folder not found
  const folderKey = (iconTheme as any).folder || "_folder";
  const folderIcon = iconDefinitions[folderKey];
  if (folderIcon) {
    return {
      char: parseFontCharacter(folderIcon.fontCharacter),
      color: folderIcon.fontColor || "#ffffff",
      id: folderKey,
    };
  }
  return { char: "d", color: "#ffffff", id: folderKey };
}
