export default async function handler(req, res) {
  const { url } = req.query;
  const response = await fetch(url, {
    headers: { "x-apisports-key": "5fbcd8796ee08b5467555175324df4c3" }
  });
  const buffer = await response.arrayBuffer();
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(Buffer.from(buffer));
