import { colors, fromFileUrl } from "./deps.ts";
function tabs2Spaces(str) {
  return str.replace(/^\t+/, (tabs)=>"  ".repeat(tabs.length));
}
/**
 * Generate an excerpt of the location in the source around the
 * specified position.
 */ export function createCodeFrame(text, lineNum, columnNum) {
  // Default settings
  const before = 2;
  const after = 3;
  const lines = text.split("\n");
  // Check if specified range is valid
  if (lines.length <= lineNum || lines[lineNum].length < columnNum) {
    return;
  }
  const start = Math.max(0, lineNum - before);
  const end = Math.min(lines.length, lineNum + after + 1);
  // Maximum space needed for line numbering in the current range.
  // Necessary when the amount of digits of the line numbering grows:
  //  999 | asdf
  // 1000 | asdjadfjsa
  const maxLineNum = String(end).length;
  const padding = " ".repeat(maxLineNum);
  // Normalize all indentation (=tabs) to use 2 spaces. We need to
  // apply the difference to the marker position to move it back in
  // place.
  const spaceLines = [];
  let maxLineLen = 0;
  for(let i = start; i < end; i++){
    const line = tabs2Spaces(lines[i]);
    spaceLines.push(line);
    if (line.length > maxLineLen) maxLineLen = line.length;
  }
  const activeLine = spaceLines[lineNum - start];
  // Move marker into correct place by taking the amount of
  // normalized tabs into account
  const count = Math.max(0, activeLine.length - lines[lineNum].length + columnNum);
  const sep = colors.dim("|");
  let out = "";
  for(let i = 0; i < spaceLines.length; i++){
    const line = spaceLines[i];
    const currentLine = colors.dim((padding + (i + start + 1)).slice(-maxLineNum));
    // Line where the error occurred
    if (i === lineNum - start) {
      out += colors.red(">") + ` ${currentLine} ${sep} ${line}\n`;
      const columnMarker = colors.bold(colors.red("^"));
      out += `  ${padding} ${sep} ${" ".repeat(count)}${columnMarker}\n`;
    } else {
      out += `  ${currentLine} ${sep} ${line}\n`;
    }
  }
  return out;
}
const STACK_FRAME = /^\s*at\s+(?:(.*)\s+)?\((.*):(\d+):(\d+)\)$/;
export function getFirstUserFile(stack) {
  const lines = stack.split("\n");
  for(let i = 0; i < lines.length; i++){
    const match = lines[i].match(STACK_FRAME);
    if (match && match) {
      const fnName = match[1] ?? "";
      const file = match[2];
      const line = +match[3];
      const column = +match[4];
      if (file.startsWith("file://")) {
        return {
          fnName,
          file,
          line,
          column
        };
      }
    }
  }
}
export async function getCodeFrame(error) {
  if (!error.stack) return;
  const file = getFirstUserFile(error.stack);
  if (file) {
    try {
      const filePath = fromFileUrl(file.file);
      const text = await Deno.readTextFile(filePath);
      return createCodeFrame(text, file.line - 1, file.column - 1);
    } catch  {
    // Ignore
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9jb2RlX2ZyYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbG9ycywgZnJvbUZpbGVVcmwgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5cbmZ1bmN0aW9uIHRhYnMyU3BhY2VzKHN0cjogc3RyaW5nKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxcdCsvLCAodGFicykgPT4gXCIgIFwiLnJlcGVhdCh0YWJzLmxlbmd0aCkpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGFuIGV4Y2VycHQgb2YgdGhlIGxvY2F0aW9uIGluIHRoZSBzb3VyY2UgYXJvdW5kIHRoZVxuICogc3BlY2lmaWVkIHBvc2l0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29kZUZyYW1lKFxuICB0ZXh0OiBzdHJpbmcsXG4gIGxpbmVOdW06IG51bWJlcixcbiAgY29sdW1uTnVtOiBudW1iZXIsXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAvLyBEZWZhdWx0IHNldHRpbmdzXG4gIGNvbnN0IGJlZm9yZSA9IDI7XG4gIGNvbnN0IGFmdGVyID0gMztcblxuICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoXCJcXG5cIik7XG5cbiAgLy8gQ2hlY2sgaWYgc3BlY2lmaWVkIHJhbmdlIGlzIHZhbGlkXG4gIGlmIChsaW5lcy5sZW5ndGggPD0gbGluZU51bSB8fCBsaW5lc1tsaW5lTnVtXS5sZW5ndGggPCBjb2x1bW5OdW0pIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGFydCA9IE1hdGgubWF4KDAsIGxpbmVOdW0gLSBiZWZvcmUpO1xuICBjb25zdCBlbmQgPSBNYXRoLm1pbihsaW5lcy5sZW5ndGgsIGxpbmVOdW0gKyBhZnRlciArIDEpO1xuXG4gIC8vIE1heGltdW0gc3BhY2UgbmVlZGVkIGZvciBsaW5lIG51bWJlcmluZyBpbiB0aGUgY3VycmVudCByYW5nZS5cbiAgLy8gTmVjZXNzYXJ5IHdoZW4gdGhlIGFtb3VudCBvZiBkaWdpdHMgb2YgdGhlIGxpbmUgbnVtYmVyaW5nIGdyb3dzOlxuICAvLyAgOTk5IHwgYXNkZlxuICAvLyAxMDAwIHwgYXNkamFkZmpzYVxuICBjb25zdCBtYXhMaW5lTnVtID0gU3RyaW5nKGVuZCkubGVuZ3RoO1xuICBjb25zdCBwYWRkaW5nID0gXCIgXCIucmVwZWF0KG1heExpbmVOdW0pO1xuXG4gIC8vIE5vcm1hbGl6ZSBhbGwgaW5kZW50YXRpb24gKD10YWJzKSB0byB1c2UgMiBzcGFjZXMuIFdlIG5lZWQgdG9cbiAgLy8gYXBwbHkgdGhlIGRpZmZlcmVuY2UgdG8gdGhlIG1hcmtlciBwb3NpdGlvbiB0byBtb3ZlIGl0IGJhY2sgaW5cbiAgLy8gcGxhY2UuXG4gIGNvbnN0IHNwYWNlTGluZXM6IHN0cmluZ1tdID0gW107XG4gIGxldCBtYXhMaW5lTGVuID0gMDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBsaW5lID0gdGFiczJTcGFjZXMobGluZXNbaV0pO1xuICAgIHNwYWNlTGluZXMucHVzaChsaW5lKTtcblxuICAgIGlmIChsaW5lLmxlbmd0aCA+IG1heExpbmVMZW4pIG1heExpbmVMZW4gPSBsaW5lLmxlbmd0aDtcbiAgfVxuXG4gIGNvbnN0IGFjdGl2ZUxpbmUgPSBzcGFjZUxpbmVzW2xpbmVOdW0gLSBzdGFydF07XG4gIC8vIE1vdmUgbWFya2VyIGludG8gY29ycmVjdCBwbGFjZSBieSB0YWtpbmcgdGhlIGFtb3VudCBvZlxuICAvLyBub3JtYWxpemVkIHRhYnMgaW50byBhY2NvdW50XG4gIGNvbnN0IGNvdW50ID0gTWF0aC5tYXgoXG4gICAgMCxcbiAgICBhY3RpdmVMaW5lLmxlbmd0aCAtIGxpbmVzW2xpbmVOdW1dLmxlbmd0aCArIGNvbHVtbk51bSxcbiAgKTtcblxuICBjb25zdCBzZXAgPSBjb2xvcnMuZGltKFwifFwiKTtcbiAgbGV0IG91dCA9IFwiXCI7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGFjZUxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbGluZSA9IHNwYWNlTGluZXNbaV07XG4gICAgY29uc3QgY3VycmVudExpbmUgPSBjb2xvcnMuZGltKFxuICAgICAgKHBhZGRpbmcgKyAoaSArIHN0YXJ0ICsgMSkpLnNsaWNlKC1tYXhMaW5lTnVtKSxcbiAgICApO1xuXG4gICAgLy8gTGluZSB3aGVyZSB0aGUgZXJyb3Igb2NjdXJyZWRcbiAgICBpZiAoaSA9PT0gbGluZU51bSAtIHN0YXJ0KSB7XG4gICAgICBvdXQgKz0gY29sb3JzLnJlZChcIj5cIikgK1xuICAgICAgICBgICR7Y3VycmVudExpbmV9ICR7c2VwfSAke2xpbmV9XFxuYDtcblxuICAgICAgY29uc3QgY29sdW1uTWFya2VyID0gY29sb3JzLmJvbGQoY29sb3JzLnJlZChcIl5cIikpO1xuICAgICAgb3V0ICs9IGAgICR7cGFkZGluZ30gJHtzZXB9ICR7XCIgXCIucmVwZWF0KGNvdW50KX0ke2NvbHVtbk1hcmtlcn1cXG5gO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgKz0gYCAgJHtjdXJyZW50TGluZX0gJHtzZXB9ICR7bGluZX1cXG5gO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59XG5cbmNvbnN0IFNUQUNLX0ZSQU1FID0gL15cXHMqYXRcXHMrKD86KC4qKVxccyspP1xcKCguKik6KFxcZCspOihcXGQrKVxcKSQvO1xuZXhwb3J0IGludGVyZmFjZSBTdGFja0ZyYW1lIHtcbiAgZm5OYW1lOiBzdHJpbmc7XG4gIGZpbGU6IHN0cmluZztcbiAgbGluZTogbnVtYmVyO1xuICBjb2x1bW46IG51bWJlcjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRGaXJzdFVzZXJGaWxlKHN0YWNrOiBzdHJpbmcpOiBTdGFja0ZyYW1lIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgbGluZXMgPSBzdGFjay5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG1hdGNoID0gbGluZXNbaV0ubWF0Y2goU1RBQ0tfRlJBTUUpO1xuICAgIGlmIChtYXRjaCAmJiBtYXRjaCkge1xuICAgICAgY29uc3QgZm5OYW1lID0gbWF0Y2hbMV0gPz8gXCJcIjtcbiAgICAgIGNvbnN0IGZpbGUgPSBtYXRjaFsyXTtcbiAgICAgIGNvbnN0IGxpbmUgPSArbWF0Y2hbM107XG4gICAgICBjb25zdCBjb2x1bW4gPSArbWF0Y2hbNF07XG5cbiAgICAgIGlmIChmaWxlLnN0YXJ0c1dpdGgoXCJmaWxlOi8vXCIpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZm5OYW1lLFxuICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgbGluZSxcbiAgICAgICAgICBjb2x1bW4sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2RlRnJhbWUoZXJyb3I6IEVycm9yKSB7XG4gIGlmICghZXJyb3Iuc3RhY2spIHJldHVybjtcblxuICBjb25zdCBmaWxlID0gZ2V0Rmlyc3RVc2VyRmlsZShlcnJvci5zdGFjayk7XG4gIGlmIChmaWxlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gZnJvbUZpbGVVcmwoZmlsZS5maWxlKTtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShmaWxlUGF0aCk7XG4gICAgICByZXR1cm4gY3JlYXRlQ29kZUZyYW1lKFxuICAgICAgICB0ZXh0LFxuICAgICAgICBmaWxlLmxpbmUgLSAxLFxuICAgICAgICBmaWxlLmNvbHVtbiAtIDEsXG4gICAgICApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gSWdub3JlXG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxNQUFNLEVBQUUsV0FBVyxRQUFRLFlBQVk7QUFFaEQsU0FBUyxZQUFZLEdBQVc7RUFDOUIsT0FBTyxJQUFJ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
// denoCacheMetadata=2432176804986595273,8929842880188878366