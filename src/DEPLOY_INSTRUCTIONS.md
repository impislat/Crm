# 🚀 Инструкция по развертыванию CRM на GitHub Pages

## Вариант 1: Автоматический деплой (САМЫЙ ПРОСТОЙ)

Ваше приложение уже работает в Figma Make! Чтобы опубликовать его:

### Шаг 1: Скачайте все файлы проекта
1. Нажмите на кнопку **Экспорт** в правом верхнем углу
2. Сохраните JSON файл с вашими данными

### Шаг 2: Используйте готовую ссылку
Ваше приложение уже доступно по ссылке в Figma Make. Просто добавьте эту страницу в закладки!

---

## Вариант 2: Разместить на своем GitHub (для продвинутых)

Если вы хотите разместить на своем GitHub Pages:

### Требования:
- Установленный Node.js (версия 18 или выше)
- Установленный Git
- Аккаунт на GitHub

### Шаг 1: Создайте новый репозиторий на GitHub
1. Зайдите на https://github.com
2. Нажмите "New repository"
3. Назовите его, например: `crm-avito`
4. Сделайте его публичным
5. Создайте репозиторий

### Шаг 2: Подготовьте проект на компьютере

Создайте папку на компьютере и внутри создайте эти файлы:

#### Файл: `package.json`
```json
{
  "name": "crm-avito",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "@emotion/react": "11.14.0",
    "@emotion/styled": "11.14.1",
    "@mui/icons-material": "7.3.5",
    "@mui/material": "7.3.5",
    "date-fns": "3.6.0",
    "lucide-react": "0.487.0",
    "motion": "12.23.24",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "sonner": "2.0.3"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "gh-pages": "^6.1.1",
    "typescript": "^5.5.3",
    "vite": "^6.3.5"
  }
}
```

#### Файл: `index.html`
```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CRM Авито - Юридические услуги</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### Файл: `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/crm-avito/', // ВАЖНО: замените на название вашего репозитория
})
```

#### Файл: `src/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### Файл: `src/App.tsx`
Скопируйте весь код из текущего файла `src/app/App.tsx`

#### Файл: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### Файл: `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### Шаг 3: Загрузите на GitHub

Откройте терминал в папке проекта и выполните:

```bash
# Инициализируйте git
git init

# Добавьте все файлы
git add .

# Сделайте первый коммит
git commit -m "Initial commit"

# Подключите к вашему репозиторию (замените USERNAME и REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Загрузите код
git branch -M main
git push -u origin main
```

### Шаг 4: Установите зависимости и деплойте

```bash
# Установите зависимости
npm install

# Соберите проект
npm run build

# Задеплойте на GitHub Pages
npm run deploy
```

### Шаг 5: Настройте GitHub Pages

1. Зайдите в настройки репозитория на GitHub
2. Перейдите в раздел "Pages"
3. В Source выберите ветку `gh-pages`
4. Нажмите Save

Через несколько минут ваше приложение будет доступно по адресу:
`https://USERNAME.github.io/crm-avito/`

---

## 🎯 РЕКОМЕНДАЦИЯ

**Самый простой вариант** - просто использовать текущую версию в Figma Make и периодически делать экспорт данных для бэкапа! Все ваши данные уже сохраняются в браузере автоматически.

Если нужна помощь с развертыванием - пишите!
