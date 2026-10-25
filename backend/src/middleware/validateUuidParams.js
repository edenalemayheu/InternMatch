export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUuidParams(...names) {
  return (req, res, next) => {
    const fields = {};
    for (const name of names) {
      if (req.params[name] !== undefined && !UUID_PATTERN.test(req.params[name])) fields[name] = 'Must be a valid UUID';
    }
    if (Object.keys(fields).length) return res.status(400).json({ error: 'Validation failed', fields });
    return next();
  };
}
