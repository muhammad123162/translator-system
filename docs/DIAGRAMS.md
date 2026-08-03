# Software Engineering Diagrams

All diagrams are written in [Mermaid](https://mermaid.js.org/) syntax.
GitHub renders these automatically when viewing this file in a browser. In
VS Code, install the **"Markdown Preview Mermaid Support"** extension (or
just open this file on GitHub) to view them rendered rather than as text.

---

## 1. Software Architecture Diagram

3-tier layered architecture with MVC on the backend.

```mermaid
flowchart TB
    subgraph Client["Presentation Layer"]
        A[HTML5 / CSS3 / Bootstrap 5<br/>Vanilla JS Views]
    end

    subgraph Server["Application Layer — Node.js / Express"]
        B[Routes]
        C[Middleware<br/>Auth · Validation · Rate Limiting]
        D[Controllers]
        E[Services<br/>Business Logic]
    end

    subgraph Data["Data Layer"]
        F[(MySQL Database)]
    end

    subgraph External["External Service"]
        G[Google Cloud<br/>Translation API v3]
    end

    A -->|HTTPS / JSON REST| B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
```

---

## 2. Use Case Diagram

```mermaid
flowchart LR
    User((User))
    Admin((Administrator))

    subgraph System["Translator System"]
        UC1[Register]
        UC2[Login / Logout]
        UC3[Translate Text]
        UC4[Auto-Detect Language]
        UC5[Swap Languages]
        UC6[Copy / Download Translation]
        UC7[View Translation History]
        UC8[Search History]
        UC9[Delete History]
        UC10[Favorite Translation]
        UC11[Manage Profile]
        UC12[View Dashboard]
        UC13[View All Users]
        UC14[Delete / Deactivate User]
        UC15[View Translation Logs]
        UC16[View System Stats]
        UC17[Manage Supported Languages]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12

    Admin --> UC2
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
```

---

## 3. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ TRANSLATION_HISTORY : creates
    USERS ||--o{ API_USAGE_LOG : generates

    USERS {
        int id PK
        string name
        string email
        string password
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    TRANSLATION_HISTORY {
        int id PK
        int user_id FK
        string source_language
        string target_language
        text original_text
        text translated_text
        boolean is_favorite
        datetime created_at
    }
    LANGUAGES {
        int id PK
        string language_name
        string language_code
        boolean is_active
    }
    API_USAGE_LOG {
        int id PK
        int user_id FK
        int character_count
        string status
        string error_message
        datetime created_at
    }
```

*Note: `LANGUAGES` is intentionally not foreign-keyed to `TRANSLATION_HISTORY`
— it's a lookup/validation table, not a hard dependency (see
`server/database/schema.sql` for the reasoning).*

---

## 4. Data Flow Diagram (DFD) — Level 0 (Context)

```mermaid
flowchart LR
    User([User])
    Admin([Administrator])
    System[Translator System]
    Google[(Google Cloud<br/>Translation API)]
    DB[(MySQL Database)]

    User -->|Registration, Login, Translation Requests| System
    System -->|Translated Text, History, Confirmations| User
    Admin -->|Management Commands| System
    System -->|Reports, Logs| Admin
    System -->|Translation Requests| Google
    Google -->|Translated Text| System
    System <-->|Read/Write Data| DB
```

## 4b. Data Flow Diagram — Level 1 (Translation Process)

```mermaid
flowchart TB
    U([User]) -->|1. Submit text + languages| P1[Validate Request]
    P1 -->|2. Valid| P2[Call Google Translation API]
    P1 -->|2. Invalid| E1[Return 422 Error]
    P2 -->|3. Success| P3[Log API Usage]
    P2 -->|3. Failure| P4[Log Error, Return 502/503]
    P3 -->|4. Save| D1[(translation_history)]
    P3 -->|5. Return result| U
    P4 --> U
```

---

## 5. System Flowchart (User Translation Journey)

```mermaid
flowchart TD
    Start([Start]) --> Login{Logged in?}
    Login -- No --> LoginPage[Login / Register]
    LoginPage --> Login
    Login -- Yes --> Translator[Open Translator Page]
    Translator --> Input[Enter text, select languages]
    Input --> AutoDetect{Auto-detect?}
    AutoDetect -- Yes --> Detect[Detect source language]
    AutoDetect -- No --> Submit
    Detect --> Submit[Click Translate]
    Submit --> Validate{Valid input?}
    Validate -- No --> ShowError[Show validation error]
    ShowError --> Input
    Validate -- Yes --> CallAPI[Call Translation Service]
    CallAPI --> APIOk{API succeeded?}
    APIOk -- No --> ShowAPIError[Show error toast]
    ShowAPIError --> Input
    APIOk -- Yes --> SaveHistory[Save to translation_history]
    SaveHistory --> ShowResult[Display translated text]
    ShowResult --> Action{User action}
    Action -- Copy --> Copy[Copy to clipboard]
    Action -- Download --> Download[Download .txt file]
    Action -- Favorite --> Favorite[Toggle favorite]
    Action -- New translation --> Input
    Copy --> End([End])
    Download --> End
    Favorite --> End
```

---

## 6. Sequence Diagram — Translate Text

```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend (translator.js)
    participant R as Express Route
    participant M as authMiddleware
    participant C as translationController
    participant S as translationService
    participant G as Google Cloud API
    participant DB as MySQL

    U->>F: Click "Translate"
    F->>R: POST /api/translations (JWT, text, languages)
    R->>M: requireAuth
    M->>DB: Find user by token payload id
    DB-->>M: User record
    M-->>R: req.user attached
    R->>C: translate(req, res)
    C->>S: translateText(text, target, source)
    S->>G: TranslationServiceClient.translateText()
    G-->>S: translatedText, detectedLanguage
    S-->>C: result
    C->>DB: apiUsageModel.logUsage()
    C->>DB: translationModel.create()
    DB-->>C: saved record
    C-->>F: 201 { translation, detectedSourceLanguage }
    F-->>U: Display translated text
```

---

## 7. Activity Diagram — User Registration & Login

```mermaid
flowchart TD
    A([Start]) --> B[User fills registration form]
    B --> C{Client-side validation passes?}
    C -- No --> B
    C -- Yes --> D[POST /api/auth/register]
    D --> E{Server validation passes?}
    E -- No --> F[Return 422 with field errors]
    F --> B
    E -- Yes --> G{Email already exists?}
    G -- Yes --> H[Return 409 Conflict]
    H --> B
    G -- No --> I[Hash password with bcrypt]
    I --> J[Create user record]
    J --> K[Sign JWT access + refresh tokens]
    K --> L[Set httpOnly cookies]
    L --> M[Redirect to Dashboard]
    M --> N([End])
```

---

## 8. Deployment Diagram

```mermaid
flowchart TB
    subgraph ClientDevice["Client Device"]
        Browser[Web Browser]
    end

    subgraph HostingEnv["Hosting Environment (Render / VPS)"]
        NodeApp[Node.js + Express App<br/>server/app.js]
    end

    subgraph DBHost["MySQL Host"]
        MySQL[(MySQL Database<br/>translator_db)]
    end

    subgraph GoogleCloud["Google Cloud Platform"]
        TranslateAPI[Cloud Translation API v3]
    end

    Browser <-->|HTTPS| NodeApp
    NodeApp <-->|SQL over TCP 3306| MySQL
    NodeApp <-->|HTTPS / gRPC| TranslateAPI
```

---

## 9. Database Schema (visual)

See `server/database/schema.sql` for the authoritative, fully-commented SQL.
The ERD above (section 3) is the visual companion to that script.