# Run Linux-Targeted Projects on macOS with UTM

Some projects are built specifically for Linux. They may depend on system packages, particular library versions, or tools that behave differently on macOS.

Instead of adapting your Mac to the project, or the project to your Mac, you can run it inside a Linux virtual machine (VM) while continuing to use your preferred macOS editor and browser.

This guide walks through that setup with a Debian VM in [UTM](https://mac.getutm.app/) and a Django app. The same approach works for any development server that listens on a network port, including Node.js, Rails, and Go apps.

## What you'll build

By the end, you'll have:

- A Debian VM in UTM that stores the project and runs its development server.
- A connection from your macOS editor to the project through SSH or a Samba share.
- Access to the app from your Mac's web browser.

```text
macOS (host)                          Debian VM (guest)
┌──────────────────────┐              ┌──────────────────────────┐
│ Code editor          │── SSH/SMB ──▶│ Project files            │
│ Web browser          │── HTTP ─────▶│ Dev server (port 8000)   │
└──────────────────────┘              └──────────────────────────┘
          connected through UTM's Shared Network
```

## Terminology

| Term | Meaning |
| --- | --- |
| Host | Your physical Mac. |
| Guest or VM | The Debian system running inside UTM. |
| UTM | A free, open-source app for running virtual machines on macOS. |
| IP address | The VM's network address, which your Mac uses to reach it. |
| SSH | A protocol for securely logging in to another machine and running commands. |
| Samba (SMB) | A protocol for sharing folders over a network. macOS can mount these shares in Finder. |
| Port | A numbered endpoint on a machine. Django's development server uses port `8000` by default. |
| Virtual environment (`venv`) | An isolated directory containing a project's Python packages. |

## Prerequisites

Before you begin, you need:

- A Mac with [UTM](https://mac.getutm.app/) installed.
- A Debian VM, or another Linux VM, that is already installed and bootable in UTM. This [four-minute setup video](https://www.youtube.com/watch?v=S8hR0CD4Kmc) covers the initial setup, although the full installation may take about an hour.
- A project to run. This guide assumes it is located at `~/projects/myapp` inside the VM and includes a `requirements.txt` file. Replace that path with your own.
- A code editor on your Mac. VS Code and Cursor support the Remote - SSH extension; any editor can work with a Samba share.

## Step 1: Configure the VM network

UTM's Shared Network mode places the VM on a private network that your Mac can access.

1. In UTM, select your Debian VM. Shut it down first if it is running.
2. Open the VM's settings and select **Network**.
3. Set **Network Mode** to **Shared Network**, then save the settings.
4. Start the VM and log in.

### Find the VM's IP address

Open a terminal inside the Debian VM and run:

```bash
ip a
```

Find a line such as `inet 192.168.64.2/24` under an interface named `enp0s1` or `eth0`. The part before `/` is the VM's IP address.

This guide uses `192.168.64.2`. Substitute your VM's address if it differs.

### Test the connection from macOS

Open Terminal on your Mac and run:

```bash
ping -c 3 192.168.64.2
```

If you receive replies, your Mac can reach the VM.

## Step 2: Set up the project in Debian

### Install the system packages

Run these commands inside the Debian VM:

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip python3-dev build-essential \
  libpq-dev libyaml-dev zlib1g-dev libjpeg-dev libffi-dev git
```

`apt update` refreshes the available package list. `apt install` adds Python tooling, a C compiler, and development headers that common Python packages may need. Check your project's documentation for any additional dependencies.

### Create a virtual environment

```bash
cd ~/projects/myapp
python3 -m venv ve
source ve/bin/activate
pip install -r requirements.txt
```

- `cd` moves into the project directory.
- `python3 -m venv ve` creates an isolated virtual environment named `ve`.
- `source ve/bin/activate` activates it. Your prompt should begin with `(ve)`. Repeat this command in each new terminal session.
- `pip install -r requirements.txt` installs the project's Python dependencies.

### Allow connections from your Mac

Django rejects requests whose host is not listed in `ALLOWED_HOSTS`. Open your settings file; the exact filename varies by project:

```bash
nano localsettings.py
```

For local development, add:

```python
ALLOWED_HOSTS = ["*"]
```

Save with `Ctrl+O`, press `Enter`, then exit with `Ctrl+X`.

> `"*"` accepts any hostname. It is convenient for local development, but you should use explicit hostnames in production.

### Start the development server

Bind Django to all network interfaces so the Mac can reach it:

```bash
./manage.py runserver 0.0.0.0:8000
```

Django normally listens on `127.0.0.1`, which is accessible only from inside the VM. Binding to `0.0.0.0` makes the server available through the VM's network interfaces.

On your Mac, open:

```text
http://192.168.64.2:8000
```

If the app loads, the network and development server are configured correctly. Press `Ctrl+C` in the VM terminal to stop the server.

## Step 3: Connect your editor

Choose either Remote - SSH or a Samba share. Remote - SSH gives supported editors a fully remote workspace and terminal. Samba mounts the project as a regular macOS network drive and works with any editor.

### Option 1: Remote - SSH

This option works with VS Code, Cursor, and other editors that support an SSH extension.

Install and start the SSH server inside Debian:

```bash
sudo apt install -y openssh-server
sudo systemctl enable --now ssh
```

Confirm that you can log in from macOS. Replace `<debian-username>` with the result of `whoami` inside the VM:

```bash
ssh <debian-username>@192.168.64.2
```

Type `yes` if prompted to trust the host, enter your Debian password, and then run `exit` after the Debian prompt appears.

In VS Code or Cursor:

1. Open Extensions with `Cmd+Shift+X` and install **Remote - SSH**.
2. Open the Command Palette with `Cmd+Shift+P` and choose **Remote-SSH: Connect to Host...**.
3. Enter `<debian-username>@192.168.64.2` and provide your password.
4. Choose **File → Open Folder...** and select `/home/<debian-username>/projects/myapp`.

The editor now reads and writes files directly inside the VM, and its integrated terminal runs Debian commands. If your editor does not support Remote - SSH, use the Samba option instead.

### Option 2: Samba share

Install Samba and create a Samba password inside the Debian VM:

```bash
sudo apt install -y samba
sudo smbpasswd -a "$USER"
```

The Samba password is separate from your Linux login password, although you may choose the same value.

Open the Samba configuration:

```bash
sudo nano /etc/samba/smb.conf
```

Add this block at the end, replacing the username and project path with your own:

```ini
[myapp]
   path = /home/<debian-username>/projects/myapp
   read only = no
   browsable = yes
   valid users = <debian-username>
   create mask = 0775
   directory mask = 0775
```

- `[myapp]` is the share name used in the network address.
- `path` points to the project directory inside Debian.
- `valid users` limits access to your Debian user.
- The mask settings define permissions for new files and directories.

Save with `Ctrl+O`, press `Enter`, and exit with `Ctrl+X`. Then restart Samba and enable it at boot:

```bash
sudo systemctl restart smbd
sudo systemctl enable smbd
```

On macOS:

1. In Finder, press `Cmd+K` or choose **Go → Connect to Server...**.
2. Enter `smb://192.168.64.2/myapp` and select **Connect**.
3. Choose **Registered User**, enter your Debian username and Samba password, and optionally save them to Keychain.
4. The share mounts at `/Volumes/myapp`.
5. Open `/Volumes/myapp` in your editor. In a macOS file dialog, press `Cmd+Shift+G` to enter the path directly.

## Daily workflow

After the initial setup, each development session takes four steps:

1. Start the VM in UTM.
2. Start the development server in the VM:

   ```bash
   cd ~/projects/myapp
   source ve/bin/activate
   ./manage.py runserver 0.0.0.0:8000
   ```

3. Reconnect your editor:
   - With Remote - SSH, choose your saved host from **Remote-SSH: Connect to Host...**.
   - With Samba, press `Cmd+K` in Finder and choose the recent server.
4. Open `http://192.168.64.2:8000` in your browser.

Saving a file triggers Django's automatic reloader, so you only need to refresh the browser. The VM's IP address will usually remain the same, but you can confirm it inside Debian with:

```bash
ip a | grep "inet 192.168.64"
```
