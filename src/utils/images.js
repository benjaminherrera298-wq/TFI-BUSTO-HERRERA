export async function imageData(file) {
  if (!file || !file.size) return '';

  if (file.size > 1024 * 1024) {
    throw new Error('La imagen debe pesar menos de 1 MB.');
  }

  if (![
    'image/png',
    'image/jpeg',
    'image/webp'
  ].includes(file.type)) {
    throw new Error('Usá una imagen PNG, JPG o WebP.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error('No se pudo leer la imagen.'));

    reader.readAsDataURL(file);
  });
}
