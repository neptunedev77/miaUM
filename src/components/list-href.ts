// Partilhado entre o servidor (paginação) e o cliente (filtros): sem "use client".

export type FilterValues = {
  tipo?: string;
  q?: string;
  campus?: string;
  local?: string;
  categoria?: string;
  desde?: string;
  ate?: string;
  pagina?: string;
};

/** Constrói o URL da lista com os filtros (vazios são omitidos). */
export function listHref(pathname: string, values: FilterValues) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}#anuncios` : `${pathname}#anuncios`;
}
