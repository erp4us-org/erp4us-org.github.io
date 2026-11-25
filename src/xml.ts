export const xml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
export const xmlResponse = (value: string, type = "application/xml") =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${value}\n`, {
    headers: { "Content-Type": `${type}; charset=utf-8` },
  });
