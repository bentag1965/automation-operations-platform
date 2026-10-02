# Production-Style Docker Deployment

The default `docker-compose.yml` remains the easy local-development and portfolio-demo stack.

`docker-compose.production.yml` demonstrates a more deployment-oriented configuration.

## Hardening Included

- multi-stage Node image
- compiled JavaScript runtime
- production-only Node dependencies
- unprivileged `node` user
- database not published to the host
- API, Prometheus, and Grafana bound to localhost by default
- required external database and Grafana passwords
- explicit restart policies
- API health check
- database health check
- startup dependency on healthy PostgreSQL
- read-only API, worker, and migration containers
- temporary writable `/tmp`
- Linux capabilities dropped from application containers
- `no-new-privileges`
- dedicated internal bridge network
- persistent PostgreSQL, Prometheus, and Grafana volumes
- one-off migration profile

## Configure

Copy the example environment file:

```powershell
Copy-Item .env.production.example .env.production
```

Edit `.env.production` and replace both example passwords.

The file is ignored by Git through the repository's `.env.*` rule.

## Build

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml build
```

## Initialize the Database

Run the migration profile once:

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml --profile migrate run --rm migrate
```

The migration executes `database/schema.sql`.

## Start

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

Check status:

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

Verify health:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Grafana remains available locally at:

```text
http://localhost:3001
```

## Stop

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml down
```

Do not add `-v` unless you intentionally want to remove the persistent data volumes.

## Boundary

This Compose file demonstrates container hardening and operational separation. It is not a substitute for a full production platform.

The Terraform reference deployment demonstrates how the same API, worker, and PostgreSQL roles map into managed AWS infrastructure.
