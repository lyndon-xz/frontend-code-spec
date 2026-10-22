export function toPosixPath(filename) {
  return filename.replaceAll('\\', '/');
}
