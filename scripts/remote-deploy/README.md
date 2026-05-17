# Remote Docker Deployment Guide

## Server Info
- **Host**: 84.247.154.52
- **User**: deploy （root 登录已禁用）
- **SSH Alias**: `shinwa-vps`（脚本默认通过此别名连接，已用 `~/.ssh/contabo_shinwa_ed25519` 密钥认证）
- **Deploy Dir**: `/home/deploy/host-shell-standalone`

> 安全说明：服务器曾被攻击，已禁用 root 登录并改为 `deploy` 用户 + ed25519 密钥认证。
> sudo 操作需要密码：`%tgb$RFV#edc@WSX!qaz`（请妥善保管，建议尽快轮换）。

## First Time Setup

如果在新机器上首次使用，请确保 `~/.ssh/config` 配置以下别名：
```
Host shinwa-vps
    HostName 84.247.154.52
    User deploy
    IdentityFile ~/.ssh/contabo_shinwa_ed25519
```
之后所有脚本默认参数 `-SshTarget shinwa-vps` 即可直接使用，无需密码。

## Scripts

| # | Script | Purpose |
|---|--------|---------|
| 0 | `setup-ssh-key.ps1` | One-time SSH key setup (no password needed after) |
| 1 | `deploy-to-remote.ps1` | Package and upload files to remote server |
| 2 | `remote-docker-start.ps1` | Build and start Docker containers |
| 3 | `remote-docker-stop.ps1` | Stop Docker containers |
| 4 | `remote-docker-logs.ps1` | View container logs |
| 5 | `remote-docker-status.ps1` | Check container status |
| 6 | `remote-docker-rebuild.ps1` | Rebuild Docker images (use -NoCache for full rebuild) |

## Execution Steps

### Step 1: Deploy files to remote server
```powershell
.\deploy-to-remote.ps1
```
Packages jar, Dockerfile, docker-compose.yml and uploads to remote server

### Step 2: Start Docker containers
```powershell
.\remote-docker-start.ps1
```
SSH to remote server and run `docker compose up -d`

### Step 3: Check status
```powershell
.\remote-docker-status.ps1
```

### Step 4: View logs (optional)
```powershell
.\remote-docker-logs.ps1
```

### Stop services
```powershell
.\remote-docker-stop.ps1
```

## Access URLs

After startup, access via:

| Service | URL |
|---------|-----|
| Host Shell API | http://84.247.154.52:8081 |
| Health Check | http://84.247.154.52:8081/actuator/health |
| Kafka | 84.247.154.52:9092 |
| PostgreSQL | 84.247.154.52:5432 (user: brix, db: brix) |
| Redis | 84.247.154.52:6379 |

## Full Profile (with observability)

```powershell
.\remote-docker-start.ps1 -Profile full
```

Additional services:
| Service | URL |
|---------|-----|
| Jaeger UI | http://84.247.154.52:16686 |
| Prometheus | http://84.247.154.52:9090 |
| Grafana | http://84.247.154.52:3000 (admin/admin123) |
