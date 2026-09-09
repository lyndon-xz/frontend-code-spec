export function toPosixPath(filename) {
  return filename.replace(/\\/g, '/');
}
