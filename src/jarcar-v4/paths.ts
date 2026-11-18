export const root = '/jarcar';
export const catalogPath = `${root}/inventario`;
export const visitPath = `${root}/visitanos`;
export const routePath = `${root}/tu-ruta`;
export const comparePath = `${root}/comparar`;
export const detailPath = (id: string) => `${catalogPath}/${encodeURIComponent(id)}`;

export const aboutPath = `${root}/jarcar-motors`;

export const savedPath = `${root}/guardados`;
