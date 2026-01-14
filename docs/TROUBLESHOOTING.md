# Troubleshooting Guide

## "Failed to download remote update" Error

This error occurs when Expo Go on your Android device cannot connect to the development server on your PC.

### Your Network Setup (Double NAT)

```
Main Router (192.168.1.x)
    │
    └──> Mercusys Router (192.168.0.1)
         │
         └──> PC (192.168.0.140)
```

**Problem**: The Expo QR code shows `exp://192.168.0.140:19000` but your Android device (on Main router's `192.168.1.x`) cannot reach the Mercusys subnet.

---

## SOLUTIONS (Try in Order)

### ✅ Solution 1: Use Expo Tunnel (RECOMMENDED)

1. Start Expo: `npm start`
2. Press `t` in the terminal
3. A new QR code will appear with `exp://...exp.direct` URL
4. Scan this new QR code - it works through any network!

```
› Metro waiting on exp://192.168.0.140:19000
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press w │ open web
› Press t │ toggle tunnel        <-- PRESS THIS!
› Shift + t │ toggle LAN/tunnel
```

### ✅ Solution 2: Start with Tunnel Flag

Stop Expo and restart with tunnel mode:

```bash
cd mobile
npm run start:tunnel
```

### ✅ Solution 3: Connect PC Directly to Main Router

Temporarily move the Ethernet cable from Mercusys to Main router.

1. Unplug Ethernet from Mercusys router
2. Plug into Main router directly
3. PC will get IP like `192.168.1.x`
4. Android device and PC now on same subnet!

### ✅ Solution 4: Use Android Emulator

Bypass network issues by using emulator:

```bash
cd mobile
npm run android
```

### ✅ Solution 5: Configure Port Forwarding (Advanced)

On your Mercusys router:

1. Log in to `192.168.0.1` (Mercusys admin panel)
2. Find **Port Forwarding** / **Virtual Server**
3. Add rule:
   - External Port: `19000`
   - Internal Port: `19000`
   - Internal IP: `192.168.0.140` (your PC)
   - Protocol: TCP

---

## Windows Firewall Fix

Run PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Navigate to project
cd C:\Users\ErnestHome\Downloads\ParallelStoryBuilder

# Run the fix script
.\fix-firewall.ps1
```

Or manually add firewall rules:

```powershell
# Run as Administrator in PowerShell
netsh advfirewall firewall add rule name="Expo Dev Server" dir=in action=allow protocol=TCP localport=19000-19002 profile=any
```

---

## Verification Steps

After applying a fix:

1. **Stop Expo**: Press `Ctrl+C`

2. **Clear Cache**:
   ```bash
   npx expo start -- --clear
   ```

3. **Start with tunnel**:
   ```bash
   npm run start:tunnel
   ```

4. **Scan QR Code** - Should now show `exp://...exp.direct` URL

5. **App should load!**

---

## Alternative: Development Server on Different Port

If port 19000 is blocked:

```bash
# Start on port 19001
PORT=19001 npm start
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm start` | Start in LAN mode (may not work with your setup) |
| `npm run start:tunnel` | Start in Tunnel mode (works anywhere!) |
| `npm run start:lan` | Explicitly use LAN mode |
| `Ctrl+C then -- --clear` | Clear cache and restart |
| `t` | Toggle tunnel mode while running |
| `Shift+t` | Cycle through network modes |

---

## Still Not Working?

1. **Check both devices are on same WiFi** (or use tunnel)
2. **Temporarily disable VPN** on PC
3. **Disable Windows Firewall** temporarily to test
4. **Restart Expo Go app** on Android
5. **Make sure PC and phone are both online**

---

## The Permanent Fix

For long-term development, consider:

1. **Connect PC directly to Main Router** (bypass Mercusys)
2. **Use tunnel mode** (`npm run start:tunnel`) - works anywhere
3. **Set up WiFi bridge** between routers

Tunnel mode is recommended for its reliability across any network setup!
