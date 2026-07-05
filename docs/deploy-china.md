# 国内访问 Vercel 部署的网站

## 问题
Vercel 服务器在海外，国内直接访问会被墙或很慢。

## 方案：Cloudflare CDN 代理（免费）

### 步骤

1. **注册 Cloudflare**：https://dash.cloudflare.com/sign-up

2. **添加你的域名到 Cloudflare**
   - 如果你有域名（如 `example.com`），在 Cloudflare 添加站点
   - 如果没有域名，先买一个（阿里云/腾讯云 `.com` 约 60 元/年）

3. **修改域名 DNS 服务器**
   - Cloudflare 会给你两个 NS 地址
   - 去你的域名注册商（阿里云/腾讯云）把 NS 改成 Cloudflare 的

4. **在 Cloudflare 添加 CNAME 记录**
   ```
   类型: CNAME
   名称: @（或 www）
   目标: cname.vercel-dns.com
   代理状态: 已代理（橙色云朵开启）
   ```

5. **在 Vercel 绑定自定义域名**
   - Vercel 项目 → Settings → Domains
   - 添加你的域名（如 `example.com`）
   - Vercel 会自动配置 SSL

6. **Cloudflare SSL 设置**
   - Cloudflare → SSL/TLS → 模式选 **Full (Strict)**

### 原理

```
用户(国内) → Cloudflare(国内节点) → Vercel(海外)
```

Cloudflare 在国内有 CDN 节点，用户访问的是国内节点，速度很快。

## 不想买域名？

可以用 Cloudflare Workers 做反代（也免费）：
1. 创建一个 Worker
2. 把 `super-video-bay.vercel.app` 反代出来
3. 通过 `your-worker.workers.dev` 访问

但这不太稳定，建议还是用自定义域名。
