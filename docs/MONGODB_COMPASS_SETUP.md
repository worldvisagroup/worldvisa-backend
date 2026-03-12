# MongoDB Compass Setup Guide

Connect to the WorldVisa MongoDB instance using MongoDB Compass. This guide covers the connection string, prerequisites, and common pitfalls.

---

## Connection String

Use this URI in MongoDB Compass (**New Connection** → paste into the connection field):

```
mongodb://worldvisa:Worldvisa%40101@72.62.241.135:27017/worldvisa?authSource=test
```

| Part | Value | Meaning |
|------|--------|---------|
| **Host** | `72.62.241.135` | MongoDB server IP |
| **Port** | `27017` | Default MongoDB port |
| **Username** | `worldvisa` | Auth username |
| **Password** | `Worldvisa@101` | Auth password (URI-encoded as `%40101` for `@`) |
| **Database** | `worldvisa` | Database to use |
| **Auth source** | `test` | Database where the user was created |

> **Note:** In the URI, `@` in the password is encoded as `%40`. If you type the password manually in Compass’s form, use `Worldvisa@101` (unencoded).

---

## Prerequisites Checklist

Before connecting, ensure all of the following are true.

### 1. Server is running and reachable

- The MongoDB instance on **72.62.241.135:27017** must be running.
- It must be reachable from the machine where you run Compass (and/or your application).

### 2. Correct credentials

- **Username:** `worldvisa`
- **Password:** `Worldvisa@101`
- Use these when filling the connection form in Compass, or rely on the full URI above (with `%40` for `@`).

### 3. Correct database and auth source

- If the user was created in the **test** authentication database, the URI **must** include:
  - `?authSource=test`
- Without `authSource=test`, authentication can fail even with the right username and password.

### 4. Network and firewall

- Firewalls, VPS security groups, and MongoDB’s `bind_ip` must allow **inbound traffic on port 27017** from:
  - Your local machine (for Compass), and/or
  - The server(s) where your application runs.

---

## Quick connect in Compass

1. Open **MongoDB Compass**.
2. Click **New Connection** (or paste into the connection string field).
3. Paste:
   ```text
   mongodb://worldvisa:Worldvisa%40101@72.62.241.135:27017/worldvisa?authSource=test
   ```
4. Click **Connect**.

If it fails, work through the checklist above (server reachable, credentials, `authSource=test`, firewall/port 27017).
