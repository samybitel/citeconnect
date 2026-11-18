/**
 * URL de connexion PostgreSQL.
 * - Local / Docker : DATABASE_URL est fourni tel quel.
 * - Wasmer Edge : la base managée injecte DB_HOST/DB_PORT/DB_NAME/DB_USERNAME/DB_PASSWORD
 *   (pas de DATABASE_URL) et impose TLS avec un certificat privé -> sslaccept=accept_invalid_certs.
 */
export function resolveDatabaseUrl(): string {
  const explicit = process.env.DATABASE_URL;
  if (explicit) return explicit;

  const { DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;
  if (DB_HOST && DB_NAME && DB_USERNAME) {
    const port = DB_PORT ?? '5432';
    const user = encodeURIComponent(DB_USERNAME);
    const pass = encodeURIComponent(DB_PASSWORD ?? '');
    return `postgresql://${user}:${pass}@${DB_HOST}:${port}/${DB_NAME}?sslmode=require&sslaccept=accept_invalid_certs`;
  }

  // Repli inoffensif (build sans base) : aucune connexion n'est ouverte à ce stade.
  return 'postgresql://localhost:5432/citeconnect';
}