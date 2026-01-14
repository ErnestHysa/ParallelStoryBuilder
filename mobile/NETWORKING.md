# Expo Development Networking

## Network Issues with Multi-Router Setup

If you have a double NAT setup (Main Router > Mercusys Router > PC), the Expo QR code
will show an IP address that your Android device cannot reach.

## Solutions

### Option 1: Expo Tunnel (Recommended)

Press `t` in the Expo terminal:

```
› Press t │ open Expo tunnel
```

This creates a public URL that bypasses all network issues.

### Option 2: Use Network Mode

Press `Shift + t` to toggle between:
- LAN - Local network (requires same subnet)
- Tunnel - Public URL (works anywhere)
- Local - localhost only

### Option 3: Connect to Same Router

Temporarily connect your PC directly to the main router (bypass Mercusys).

### Option 4: Port Forwarding (Advanced)

1. Log into Mercusys router
2. Set up port forwarding: 19000 -> PC's IP
3. Set up static route on main router

### Option 5: Use ADB (Android Debug Bridge)

If emulator/simulator works, you can test there:

```bash
# List devices
adb devices

# Install Expo Go on emulator (if needed)
# Then scan QR within emulator
```

## Quick Fix

Just press `t` in the Expo terminal to use tunnel mode!
