# User Manual

A step-by-step guide to using LinguaBridge, for end users (and
administrators).

## 1. Creating an Account

1. Go to the homepage and click **"Create Free Account"** (or navigate to
   `/register`)
2. Fill in your **Full Name**, **Email Address**, and a **Password**
   (at least 8 characters, including at least one number)
3. Confirm your password in the second field
4. Click **Create Account**

You'll be logged in automatically and taken to your Dashboard.

## 2. Logging In

1. Go to `/login`
2. Enter your email and password
3. Click **Log In**

If you forget your password, there is currently no self-service "forgot
password" flow — contact a system administrator to have it reset.

## 3. Translating Text

1. From the sidebar, click **Translator**
2. Choose your **source language** (or leave it on "Detect Language" to
   have it identified automatically)
3. Choose your **target language**
4. Type or paste your text into the left box (up to 5,000 characters —
   a live counter shows how much you've used)
5. Click **Translate**
6. The translated text appears in the right-hand box

**Other actions on this page:**
- **Swap** (the circular arrows icon) — reverses source and target
  languages and swaps the two text boxes. Disabled while source is set to
  "Detect Language."
- **Clear** — empties both text boxes and resets the result state
- **Copy** — copies the translated text to your clipboard
- **Download** — saves the translated text as a `.txt` file
- **Favorite** — marks the translation you just made as a favorite, so you
  can find it quickly later in History

## 4. Viewing and Managing Translation History

1. From the sidebar, click **History**
2. Use the **search box** to find translations containing specific text
   (searches both the original and translated text)
3. Check **"Favorites only"** to filter to just your favorited translations
4. Click the **star icon** on any row to toggle its favorite status
5. Click the **trash icon** to delete a single entry (you'll be asked to
   confirm)
6. Click **"Clear All"** at the top to delete your entire history at once
   (also asks for confirmation — this cannot be undone)

## 5. Managing Your Profile

1. From the sidebar, click **Profile**
2. Under **Account Information**, update your name or email, then click
   **Save Changes**
3. Under **Change Password**, enter your current password and a new one,
   then click **Update Password**

## 6. Settings

1. From the sidebar, click **Settings**
2. Toggle **Dark Mode** on or off — this is saved on your device and
   applies across the app
3. Choose a **Default Target Language** — this pre-selects that language
   when you open the Translator, saving you a click each time

## 7. Logging Out

Click your account icon in the top-right corner, then **Log Out**.

---

## For Administrators

If your account has the **admin** role, you'll see an additional **Admin
Dashboard** link in the sidebar and account menu.

### Overview Tab
Shows total users, total translations, and API errors logged, plus a
14-day translation volume chart and a breakdown of the most-translated-to
languages.

### Users Tab
- View every registered user, their role, and join date
- Toggle the switch in the **Status** column to activate/deactivate an
  account (deactivated users cannot log in)
- Click the trash icon to permanently delete a user and all their
  translation history (you cannot delete your own account while logged in,
  as a safety guard)

### Translation Logs Tab
A system-wide feed of every translation performed, showing which user
translated what language pair and when — useful for monitoring usage and
spotting abuse.

### Languages Tab
Toggle which languages appear in the Translator's dropdowns. This project
is scoped to English, Hausa, Igbo, and Yoruba by default.