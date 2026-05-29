export function getUserId(req) {
  const userId = req.header("x-user-id");
  return typeof userId === "string" && userId.trim() ? userId.trim() : null;
}

export function requireUserId(req, res) {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Usuario nao autenticado" });
    return null;
  }

  return userId;
}
