# 貸款智能初審客服系統

一套可直接啟動的 Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui 風格貸款官網與 CRM 範例專案。

## 功能

- 前台官方網站首頁
- 右下角固定智能聊天機器人
- 規則式初審引擎
- 模型先陪聊、規則引擎最後判斷
- Admin / Sales 角色登入
- 後台 Dashboard、案件列表、案件詳情
- 通知模組介面預留 Email / LINE / Telegram
- Prisma schema + seed

## 技術棧

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui 風格元件
- PostgreSQL
- Prisma ORM
- Zod
- Zustand

## 安裝

```bash
npm install
```

## 環境變數

複製 `.env.example` 為 `.env.local`，並填入資料庫連線字串與登入密鑰。

## Prisma

產生 client：

```bash
npm run prisma:generate
```

推送 schema 到資料庫：

```bash
npm run prisma:push
```

執行 seed：

```bash
npm run seed
```

## 啟動

```bash
npm run dev
```

打開 `http://localhost:3000`

### Windows 一鍵啟動

直接雙擊 `run.bat`，它會：

1. 檢查 Node.js / npm
2. 安裝依賴（如果尚未安裝）
3. 產生 `.env.local`（若不存在，從 `.env.example` 複製）
4. 產生 Prisma client
5. 若 `.env.local` 內有 `DATABASE_URL`，就執行 `prisma db push` 與 seed
6. 同時啟動兩個 Next.js 開發伺服器並自動開啟瀏覽器

### Windows Ollama 一鍵啟動

如果你要先把本機模型服務起來，直接雙擊 `setup-ollama.bat`，它會：

1. 檢查是否有安裝 Ollama CLI
2. 若 Ollama 服務尚未啟動，就開啟一個可見視窗執行 `ollama serve`
3. 等待服務就緒後，自動確認並下載預設模型 `qwen2.5:7b`

聊天機器人會先用 Ollama 做逐步陪聊，再在最後送件時交給規則引擎做初審。

## 登入帳號

- Admin: `admin@loanflow.tw` / `admin1234`
- Sales: `sales@loanflow.tw` / `sales1234`

## Ollama

如果你要讓右下角機器人接本機模型，請先安裝並啟動 Ollama，然後拉一個模型：

```bash
ollama pull qwen2.5:7b
```

如果有填 `OLLAMA_BASE_URL`，預設會連到你的 Ollama 服務，並使用 `OLLAMA_MODEL`，預設值是 `qwen2.5:7b`。

你也可以改成較輕的模型，例如：

```bash
ollama pull llama3.2:3b
```

若你想用 Windows 一鍵方式完成上述流程，直接執行 `setup-ollama.bat` 即可。

## 主要路由

- `/` 官網首頁
- `/login` 後台登入
- `/dashboard` Dashboard
- `/dashboard/leads` 案件列表
- `/dashboard/leads/[id]` 案件詳情

## API

- `POST /api/leads` 建立案件
- `GET /api/leads` 查詢案件
- `GET /api/leads/:id` 取得案件詳情
- `PATCH /api/leads/:id` 更新狀態 / 指派 / 新增備註
- `POST /api/auth/login` 登入
- `POST /api/auth/logout` 登出

## Vercel 上線

如果你要最快上線，建議直接部署到 Vercel。

### 1. 推到 GitHub

先把這個專案推到你的 GitHub repo。

### 2. 匯入 Vercel

到 Vercel 新建 Project，選你的 repo 匯入。

### 3. 環境變數

在 Vercel 的 Environment Variables 裡加入：

- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SALES_EMAIL`
- `SALES_PASSWORD`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

第一次上線其實可以先不填任何環境變數，系統會自動走 demo store 與 fallback 回覆，先把網站部署起來。

如果你暫時還沒有正式 Ollama 服務，可以先不填 `OLLAMA_BASE_URL`，系統會直接走 fallback 回覆，不會卡等本機模型。

### 4. Ollama 正式上線

Vercel **不能** 連到你電腦本機的 `http://127.0.0.1:11434`。如果你要讓線上網站真的用到 Ollama，`OLLAMA_BASE_URL` 必須是外網可訪問的 HTTPS 網址，例如：

```env
OLLAMA_BASE_URL="https://ollama.yourdomain.com"
OLLAMA_MODEL="qwen2.5:7b"
```

你可以用以下其中一種方式把 Ollama 放到外網：

1. **VPS + 反向代理**
   - 在雲端主機安裝 Ollama
   - 用 Nginx / Caddy / Traefik 封裝成 HTTPS
   - 對外提供 `https://ollama.yourdomain.com`

2. **Cloudflare Tunnel**
   - 本機或伺服器跑 Ollama
   - 用 Cloudflare Tunnel 暴露成公開 HTTPS 網址
   - 適合先測試或快速上線

3. **暫時測試用 ngrok / 其他 tunnel**
   - 適合短期驗證
   - 不建議當正式商用網址

如果你只是先把網站上架，Ollama 可以先不填；等你有外網模型服務後，再把 `OLLAMA_BASE_URL` 補上即可。

### 5. 資料庫

建議使用雲端 PostgreSQL，例如 Neon、Supabase、Railway 或 Vercel Marketplace 的資料庫服務。

#### Supabase 快速建立

如果你用 Supabase，建議這樣做：

1. 建立 `New project`
2. `Project name` 可填 `loan-smart-intake-crm`
3. `Database password` 請設一組強密碼並保存
4. `Region` 選靠近你使用者的地區，例如 `Singapore`
5. `Data API` 先不用開
6. 建立完成後，進到 `Connect`
7. 複製 PostgreSQL 連線字串，貼到 Vercel 的 `DATABASE_URL`

可用格式範例：

```env
DATABASE_URL="postgresql://postgres:你的密碼@db.你的projectref.supabase.co:5432/postgres?sslmode=require"
```

你的 Supabase project ref 是 `zzymdzypksdxjqbevqid`，所以如果你用 direct connection，主機會長這樣：

```env
DATABASE_URL="postgresql://postgres:你的密碼@db.zzymdzypksdxjqbevqid.supabase.co:5432/postgres?sslmode=require"
```

如果你要給 Vercel / serverless 環境用，請到 Supabase 的 `Connect` 頁面複製 `Transaction pooler` 連線字串，再加上 Prisma 需要的參數：

```env
DATABASE_URL="postgresql://postgres.你的projectref:你的密碼@aws-0-你的region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

如果你要先用 Vercel 上線、之後再補資料庫，也可以先部署，再回來補 `DATABASE_URL`。

### 6. 部署

Vercel 會自動偵測 Next.js，直接按 Deploy 即可。

### 7. 上線後檢查

- `/` 首頁是否正常
- `/login` 是否能登入
- `/dashboard` 是否能看到案件
- 右下角機器人是否能送件
- `POST /api/leads` 是否可建立案件

## 備註

- 目前前後台都會優先使用內建 demo store，方便你在未串 PostgreSQL 時直接看到資料。
- Prisma schema 與 seed 已完整提供，之後可把 repository 切換到真實資料庫即可。
- 如果 `.env.local` 還是預設的示範 `DATABASE_URL`，`run.bat` 會自動跳過 PostgreSQL，直接進 demo 模式，避免 `P1000`。
